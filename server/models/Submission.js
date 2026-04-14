import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  file: { type: String },
  grade: { type: Number },
  feedback: { type: String },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Submission', submissionSchema);
