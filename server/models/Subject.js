import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  faculty: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }]
}, { timestamps: true });

export default mongoose.model('Subject', subjectSchema);
