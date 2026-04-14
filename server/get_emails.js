import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jis_academic';

mongoose.connect(uri).then(async () => {
  const users = await mongoose.connection.collection('users').find({}).toArray();
  console.log('--- ALL USERS ---');
  users.forEach(u => console.log(`${u.role.toUpperCase()} | Name: ${u.name} | Email: ${u.email}`));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
