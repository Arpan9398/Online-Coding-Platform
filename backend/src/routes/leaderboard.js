import { Router } from 'express';
import Submission from '../models/Submission.js';
import { wrap } from '../middleware/errors.js';

const router = Router();

/**
 * Ranking rules:
 *   1. For every user and problem, keep only the best submission (highest score, earliest if tied).
 *   2. Total score = sum of those best scores.
 *   3. Sort by total score, then problems fully solved, then whoever reached their result first.
 */
router.get('/', wrap(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);

  const rows = await Submission.aggregate([
    { $sort: { score: -1, createdAt: 1 } },
    { $group: {
        _id: { user: '$user', problem: '$problem' },
        best: { $first: '$score' },
        accepted: { $first: { $cond: [{ $eq: ['$status', 'ACCEPTED'] }, 1, 0] } },
        reachedAt: { $first: '$createdAt' }
    } },
    { $group: {
        _id: '$_id.user',
        totalScore: { $sum: '$best' },
        solved: { $sum: '$accepted' },
        lastImprovement: { $max: '$reachedAt' }
    } },
    { $sort: { totalScore: -1, solved: -1, lastImprovement: 1 } },
    { $limit: limit },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { _id: 0, userId: { $toString: '$_id' }, name: '$user.name', totalScore: 1, solved: 1, lastImprovement: 1 } }
  ]);

  res.json(rows.map((r, i) => ({ rank: i + 1, ...r })));
}));

export default router;
