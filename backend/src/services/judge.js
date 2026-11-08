import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { config } from '../config.js';

/*
 * Code judge: runs a submission against each test case in a separate child process,
 * feeding the test input on stdin and comparing stdout with the expected output.
 *
 * Protections: wall-clock time limit (process is killed), output size cap, temp directory
 * per submission, scrubbed environment, no shell, and a cap on concurrent judging.
 * It does NOT isolate the filesystem or network. For untrusted public users, run the whole
 * backend inside a locked-down container (see README).
 */

const MAX_OUTPUT_BYTES = 64 * 1024;

const LANGUAGE_SETTINGS = {
  python: {
    file: 'main.py',
    command: () => process.env.PYTHON_CMD || (process.platform === 'win32' ? 'python' : 'python3'),
    args: () => ['-I', '-B', 'main.py']
  },
  javascript: {
    file: 'main.js',
    command: () => process.execPath,
    args: () => ['--max-old-space-size=128', 'main.js']
  }
};

export const LANGUAGES = Object.keys(LANGUAGE_SETTINGS);

export class JudgeUnavailableError extends Error {}

// ----- limit how many submissions run at once -----
let active = 0;
const waiting = [];
async function acquire() {
  if (active < config.judgeConcurrency) {
    active += 1;
    return;
  }
  await new Promise((resolve) => waiting.push(resolve));
}
function release() {
  const next = waiting.shift();
  if (next) next(); // hand the slot straight to the next waiter
  else active -= 1;
}

function runProcess({ command, args, cwd, input, timeLimitMs }) {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const child = spawn(command, args, {
      cwd,
      env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, PYTHONIOENCODING: 'utf-8' },
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    });

    let stdout = '';
    let stderr = '';
    let outBytes = 0;
    let timedOut = false;
    let overflow = false;
    let settled = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeLimitMs);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      outBytes += Buffer.byteLength(chunk);
      if (outBytes > MAX_OUTPUT_BYTES) {
        if (!overflow) {
          overflow = true;
          child.kill('SIGKILL');
        }
        return;
      }
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      if (stderr.length < 4000) stderr += chunk;
    });
    child.stdin.on('error', () => {}); // the program may exit without reading its input

    child.on('error', (err) => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      resolve({ code, stdout, stderr, timedOut, overflow, runtimeMs: Math.round(performance.now() - started) });
    });

    child.stdin.end(input);
  });
}

/** Ignore trailing spaces on each line and trailing blank lines. */
export const normalize = (text) =>
  String(text ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');

/**
 * @param {{language: string, code: string, testCases: {input: string, expectedOutput: string}[], timeLimitMs?: number}} job
 * @returns {Promise<{status: string, passed: number, total: number, maxRuntimeMs: number,
 *                    results: {index: number, status: string, runtimeMs: number, actual: string, stderr: string}[]}>}
 */
export async function judge({ language, code, testCases, timeLimitMs = 2000 }) {
  const settings = LANGUAGE_SETTINGS[language];
  if (!settings) throw new Error(`Unsupported language: ${language}`);

  await acquire();
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'judge-'));
  try {
    await fs.writeFile(path.join(dir, settings.file), code, 'utf8');

    const results = [];
    for (let index = 0; index < testCases.length; index += 1) {
      const testCase = testCases[index];
      let run;
      try {
        run = await runProcess({
          command: settings.command(),
          args: settings.args(),
          cwd: dir,
          input: testCase.input ?? '',
          timeLimitMs
        });
      } catch (err) {
        if (err.code === 'ENOENT') throw new JudgeUnavailableError(`The ${language} runtime is not installed on the server`);
        throw err;
      }

      let status;
      if (run.timedOut) status = 'TIME_LIMIT_EXCEEDED';
      else if (run.overflow) status = 'OUTPUT_LIMIT_EXCEEDED';
      else if (run.code !== 0) status = 'RUNTIME_ERROR';
      else status = normalize(run.stdout) === normalize(testCase.expectedOutput) ? 'PASSED' : 'WRONG_ANSWER';

      results.push({ index, status, runtimeMs: run.runtimeMs, actual: run.stdout, stderr: run.stderr });
    }

    const passed = results.filter((r) => r.status === 'PASSED').length;
    const firstFailure = results.find((r) => r.status !== 'PASSED');
    return {
      status: firstFailure ? firstFailure.status : 'ACCEPTED',
      passed,
      total: results.length,
      maxRuntimeMs: Math.max(0, ...results.map((r) => r.runtimeMs)),
      results
    };
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
    release();
  }
}
