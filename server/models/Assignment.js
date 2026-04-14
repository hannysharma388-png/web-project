import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  marks: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Assignment', assignmentSchema);
