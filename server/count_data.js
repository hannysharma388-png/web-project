import mongoose from 'mongoose';
import Assignment from './models/Assignment.js';
import Submission from './models/Submission.js';
import dotenv from 'dotenv';

dotenv.config();

async function count() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const assignmentCount = await Assignment.countDocuments();
    const submissionCount = await Submission.countDocuments();
    console.log(`Assignments: ${assignmentCount}`);
    console.log(`Submissions: ${submissionCount}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

count();
