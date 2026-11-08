import assert from 'node:assert/strict';
import { test } from 'node:test';
import { judge, normalize } from '../src/services/judge.js';

const addCases = [
  { input: '1 2\n', expectedOutput: '3' },
  { input: '10 -4\n', expectedOutput: '6' }
];

test('normalize ignores trailing spaces and blank lines', () => {
  assert.equal(normalize('a  \r\nb\n\n'), 'a\nb');
});

test('python: correct solution is ACCEPTED', async () => {
  const r = await judge({ language: 'python', code: 'a, b = map(int, input().split())\nprint(a + b)\n', testCases: addCases });
  assert.equal(r.status, 'ACCEPTED');
  assert.equal(r.passed, 2);
});

test('javascript: correct solution is ACCEPTED', async () => {
  const code = "const [a, b] = require('fs').readFileSync(0, 'utf8').trim().split(' ').map(Number);\nconsole.log(a + b);\n";
  const r = await judge({ language: 'javascript', code, testCases: addCases });
  assert.equal(r.status, 'ACCEPTED');
});

test('wrong answer gets partial results', async () => {
  const r = await judge({ language: 'python', code: 'print(3)\n', testCases: addCases });
  assert.equal(r.status, 'WRONG_ANSWER');
  assert.equal(r.passed, 1);
  assert.equal(r.total, 2);
});

test('crash is reported as RUNTIME_ERROR', async () => {
  const r = await judge({ language: 'python', code: 'raise ValueError("boom")\n', testCases: addCases });
  assert.equal(r.status, 'RUNTIME_ERROR');
  assert.match(r.results[0].stderr, /boom/);
});

test('infinite loop is stopped with TIME_LIMIT_EXCEEDED', async () => {
  const r = await judge({ language: 'python', code: 'while True:\n    pass\n', testCases: [addCases[0]], timeLimitMs: 500 });
  assert.equal(r.status, 'TIME_LIMIT_EXCEEDED');
});

test('endless output is stopped with OUTPUT_LIMIT_EXCEEDED', async () => {
  const r = await judge({ language: 'python', code: 'while True:\n    print("x" * 1000)\n', testCases: [addCases[0]], timeLimitMs: 3000 });
  assert.equal(r.status, 'OUTPUT_LIMIT_EXCEEDED');
});
