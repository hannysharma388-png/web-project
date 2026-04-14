import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  faculty: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);
