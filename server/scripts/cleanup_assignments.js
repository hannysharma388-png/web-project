import mongoose from 'mongoose';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function cleanup() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const assignmentCount = await Assignment.countDocuments();
    const submissionCount = await Submission.countDocuments();

    console.log(`Deleting ${assignmentCount} assignments...`);
    await Assignment.deleteMany({});
    
    console.log(`Deleting ${submissionCount} submissions...`);
    await Submission.deleteMany({});

    console.log('Database cleanup completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error during cleanup:', err);
    process.exit(1);
  }
}

cleanup();
