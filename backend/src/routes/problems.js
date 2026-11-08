import { Router } from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';
import { optionalAuth, requireAdmin, requireAuth } from '../middleware/auth.js';
import { HttpError, wrap } from '../middleware/errors.js';
import { JudgeUnavailableError, LANGUAGES, judge } from '../services/judge.js';

const router = Router();

// ---------- validation ----------
const testCaseSchema = z.object({
  input: z.string().max(10000).default(''),
  expectedOutput: z.string().max(10000),
  isHidden: z.boolean().default(false)
});

const problemSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
  description: z.string().trim().min(10, 'Describe the problem (at least 10 characters)').max(20000),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  points: z.number().int().min(1).max(1000).default(100),
  tags: z.array(z.string().trim().min(1).max(30)).max(8).default([]),
  timeLimitMs: z.number().int().min(500).max(10000).default(2000),
  starterCode: z.object({
    python: z.string().max(5000).default(''),
    javascript: z.string().max(5000).default('')
  }).default({}),
  testCases: z.array(testCaseSchema).min(1, 'Add at least one test case').max(50)
}).refine((p) => p.testCases.some((t) => !t.isHidden), {
  message: 'Keep at least one visible test case as a sample',
  path: ['testCases']
});

const codeSchema = z.object({
  language: z.enum(LANGUAGES),
  code: z.string().min(1, 'Write some code first').max(50000, 'Code is too long (50,000 characters max)')
});

// 15 runs or submissions per user per minute
const judgeLimiter = rateLimit({
  windowMs: 60_000,
  limit: 15,
  keyGenerator: (req) => req.user.id,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many runs. Wait a minute and try again.' }
});

// ---------- helpers ----------
async function loadProblem(id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, 'Problem not found');
  const problem = await Problem.findById(id);
  if (!problem) throw new HttpError(404, 'Problem not found');
  return problem;
}

const fullView = (p) => ({
  id: String(p._id), title: p.title, description: p.description, difficulty: p.difficulty, points: p.points,
  tags: p.tags, timeLimitMs: p.timeLimitMs, starterCode: p.starterCode, testCases: p.testCases
});

/** What students may see: hidden test cases are never sent. */
const studentView = (p) => ({
  id: String(p._id), title: p.title, description: p.description, difficulty: p.difficulty, points: p.points,
  tags: p.tags, timeLimitMs: p.timeLimitMs,
  starterCode: { python: p.starterCode?.python || '', javascript: p.starterCode?.javascript || '' },
  sampleCases: p.testCases.filter((t) => !t.isHidden).map((t) => ({ input: t.input, expectedOutput: t.expectedOutput })),
  hiddenCount: p.testCases.filter((t) => t.isHidden).length
});

const clip = (text, max = 1500) => {
  const s = String(text ?? '');
  return s.length > max ? `${s.slice(0, max)}\n… (truncated)` : s;
};

/** Per-test verdicts. Hidden cases only reveal pass/fail and timing. */
function presentResults(results, cases) {
  return results.map((r) => {
    const tc = cases[r.index];
    const base = { index: r.index + 1, status: r.status, runtimeMs: r.runtimeMs, hidden: tc.isHidden };
    if (tc.isHidden) return base;
    return { ...base, input: clip(tc.input), expectedOutput: clip(tc.expectedOutput), actual: clip(r.actual), error: clip(r.stderr, 1000) };
  });
}

async function runJudge(problem, body, cases) {
  const { language, code } = codeSchema.parse(body);
  try {
    const verdict = await judge({ language, code, testCases: cases, timeLimitMs: problem.timeLimitMs });
    return { language, code, verdict };
  } catch (err) {
    if (err instanceof JudgeUnavailableError) throw new HttpError(503, err.message);
    throw err;
  }
}

// ---------- problem management ----------
router.get('/', optionalAuth, wrap(async (req, res) => {
  const problems = await Problem.find().select('title difficulty points tags timeLimitMs').sort({ createdAt: 1 }).lean();

  const progress = new Map();
  if (req.user) {
    const rows = await Submission.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: '$problem', best: { $max: '$score' }, solved: { $max: { $cond: [{ $eq: ['$status', 'ACCEPTED'] }, 1, 0] } } } }
    ]);
    rows.forEach((r) => progress.set(String(r._id), r));
  }

  res.json(problems.map((p) => {
    const row = progress.get(String(p._id));
    return {
      id: String(p._id), title: p.title, difficulty: p.difficulty, points: p.points, tags: p.tags,
      status: row ? (row.solved ? 'solved' : 'attempted') : null,
      bestScore: row ? row.best : 0
    };
  }));
}));

router.post('/', requireAdmin, wrap(async (req, res) => {
  const data = problemSchema.parse(req.body);
  const problem = await Problem.create({ ...data, createdBy: req.user.id });
  res.status(201).json(fullView(problem));
}));

router.get('/:id', wrap(async (req, res) => {
  res.json(studentView(await loadProblem(req.params.id)));
}));

router.get('/:id/admin', requireAdmin, wrap(async (req, res) => {
  res.json(fullView(await loadProblem(req.params.id)));
}));

router.put('/:id', requireAdmin, wrap(async (req, res) => {
  const problem = await loadProblem(req.params.id);
  Object.assign(problem, problemSchema.parse(req.body));
  await problem.save();
  res.json(fullView(problem));
}));

router.delete('/:id', requireAdmin, wrap(async (req, res) => {
  const problem = await loadProblem(req.params.id);
  await Submission.deleteMany({ problem: problem._id });
  await problem.deleteOne();
  res.status(204).end();
}));

// ---------- running and submitting code ----------

/** Dry run against the visible sample cases only. Nothing is saved or scored. */
router.post('/:id/run', requireAuth, judgeLimiter, wrap(async (req, res) => {
  const problem = await loadProblem(req.params.id);
  const cases = problem.testCases.filter((t) => !t.isHidden);
  const { verdict } = await runJudge(problem, req.body, cases);
  res.json({
    status: verdict.status, passed: verdict.passed, total: verdict.total,
    runtimeMs: verdict.maxRuntimeMs, results: presentResults(verdict.results, cases)
  });
}));

/** Judges against every test case, saves the submission and calculates the score. */
router.post('/:id/submit', requireAuth, judgeLimiter, wrap(async (req, res) => {
  const problem = await loadProblem(req.params.id);
  const cases = problem.testCases;
  const { language, code, verdict } = await runJudge(problem, req.body, cases);

  // Partial credit: points are proportional to the share of test cases passed.
  const score = Math.round((problem.points * verdict.passed) / verdict.total);
  const submission = await Submission.create({
    user: req.user.id, problem: problem._id, language, code,
    status: verdict.status, passed: verdict.passed, total: verdict.total,
    score, maxScore: problem.points, runtimeMs: verdict.maxRuntimeMs,
    results: presentResults(verdict.results, cases)
  });
  res.status(201).json(submissionView(submission, true));
}));

router.get('/:id/submissions', requireAuth, wrap(async (req, res) => {
  const problem = await loadProblem(req.params.id);
  const rows = await Submission.find({ user: req.user.id, problem: problem._id }).sort({ createdAt: -1 }).limit(20);
  res.json(rows.map((s) => submissionView(s, false)));
}));

function submissionView(s, withResults) {
  const view = {
    id: String(s._id), language: s.language, code: s.code, status: s.status, passed: s.passed, total: s.total,
    score: s.score, maxScore: s.maxScore, runtimeMs: s.runtimeMs, createdAt: s.createdAt
  };
  if (withResults) view.results = s.results;
  return view;
}

export default router;
