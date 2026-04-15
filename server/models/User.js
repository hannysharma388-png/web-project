import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'faculty', 'student'], required: true },
  roleAttr: { type: String, default: '' } // stores 'course' for student or 'department' for faculty
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const bcrypt = (await import('bcryptjs')).default;
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

export default mongoose.model('User', userSchema);
