import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema({
  day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], required: true },
  period: { type: Number, min: 1, max: 8, required: true },
  subject: { type: String, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  room: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('Timetable', timetableSchema);
