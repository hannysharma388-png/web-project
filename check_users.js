import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jis_academic')
  .then(async () => {
    console.log('Connected to DB');
    
    // Assuming User model path
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    const admin = await User.findOne({ role: 'admin' }).select('email password role');
    const faculty = await User.findOne({ role: 'faculty' }).select('email password role');
    const student = await User.findOne({ role: 'student' }).select('email password role');
    
    console.log('=== ACTUAL ADMIN ===');
    console.log(admin ? `Email: ${admin.email}, Password: ${admin.password ? '[hashed]' : 'plain'}` : 'No admin');
    
    console.log('\n=== FIRST FACULTY ===');
    console.log(faculty ? `Email: ${faculty.email}` : 'No faculty');
    
    console.log('\n=== FIRST STUDENT ===');
    console.log(student ? `Email: ${student.email}` : 'No student');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });

