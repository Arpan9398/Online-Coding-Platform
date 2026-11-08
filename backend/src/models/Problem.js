import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, default: '' },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false } // hidden cases count for the score but are never shown to students
  },
  { _id: false }
);

const problemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    points: { type: Number, required: true, min: 1, max: 1000, default: 100 },
    tags: { type: [String], default: [] },
    timeLimitMs: { type: Number, default: 2000, min: 500, max: 10000 },
    starterCode: {
      python: { type: String, default: '' },
      javascript: { type: String, default: '' }
    },
    testCases: { type: [testCaseSchema], validate: (v) => v.length > 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export default mongoose.model('Problem', problemSchema);
