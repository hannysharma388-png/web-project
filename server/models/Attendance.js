import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['present', 'absent', 'late'], default: 'absent' },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Attendance', attendanceSchema);
