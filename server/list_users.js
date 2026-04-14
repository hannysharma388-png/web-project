import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function listUsers() {
  await mongoose.connect(process.env.MONGODB_URI);
  const roles = ['admin', 'faculty', 'student'];
  for (const role of roles) {
    const users = await User.find({ role }).limit(3);
    console.log(`--- ${role.toUpperCase()} ---`);
    users.forEach(u => console.log(`${u.name} | ${u.email} | password: ${role}123`));
  }
  process.exit(0);
}

listUsers();
