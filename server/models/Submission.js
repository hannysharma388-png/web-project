import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filePath: { type: String },
  grade: { type: Number },
  feedback: { type: String },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Submission', submissionSchema);
