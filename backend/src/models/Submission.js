import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
    language: { type: String, enum: ['python', 'javascript'], required: true },
    code: { type: String, required: true },
    status: { type: String, required: true }, // ACCEPTED, WRONG_ANSWER, RUNTIME_ERROR, TIME_LIMIT_EXCEEDED, OUTPUT_LIMIT_EXCEEDED
    passed: { type: Number, required: true },
    total: { type: Number, required: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    runtimeMs: { type: Number, default: 0 },
    results: { type: Array, default: [] } // per-test verdicts (hidden cases are redacted)
  },
  { timestamps: true }
);

submissionSchema.index({ user: 1, problem: 1, createdAt: -1 });
submissionSchema.index({ score: -1, createdAt: 1 });

export default mongoose.model('Submission', submissionSchema);
