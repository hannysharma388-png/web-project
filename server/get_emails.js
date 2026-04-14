import mongoose from 'mongoose';
mongoose.connect('mongodb://localhost:27017/college').then(async () => {
  const facs = await mongoose.connection.collection('users').find({role: 'faculty'}).limit(2).toArray();
  const stus = await mongoose.connection.collection('users').find({role: 'student'}).limit(2).toArray();
  console.log('--- FACULTY ---');
  facs.forEach(f => console.log(f.name + ' : ' + f.email));
  console.log('--- STUDENTS ---');
  stus.forEach(s => console.log(s.name + ' : ' + s.email));
  process.exit(0);
});
