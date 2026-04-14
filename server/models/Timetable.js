import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema({
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], required: true },
  startTime: { type: String, required: true }, // e.g. "09:00"
  endTime: { type: String, required: true }    // e.g. "10:30"
}, { timestamps: true });

export default mongoose.model('Timetable', timetableSchema);
