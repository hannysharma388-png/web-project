import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Section from '../models/Section.js';
import Attendance from '../models/Attendance.js';
import Test from '../models/Test.js';
import Question from '../models/Question.js';
import Result from '../models/Result.js';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import Timetable from '../models/Timetable.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/college');
    console.log('Connected to MongoDB');

    // Create required directories if they don't exist
    const dirs = ['../uploads/assignments', '../uploads/submissions'];
    dirs.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });

    // Clear existing data
    await User.deleteMany({});
    await Subject.deleteMany({});
    await Section.deleteMany({});
    await Attendance.deleteMany({});
    await Test.deleteMany({});
    await Question.deleteMany({});
    await Result.deleteMany({});
    await Assignment.deleteMany({});
    await Submission.deleteMany({});
    await Timetable.deleteMany({});

    // 1. Create Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@jis.edu',
      password: 'admin123',
      role: 'admin'
    });

    // 2. Create Sections
    const sectionsData = [
      { name: 'BCA-A', branch: 'BCA' },
      { name: 'BCA-B', branch: 'BCA' },
      { name: 'CSE-A', branch: 'B.Tech CSE' },
      { name: 'CSE-B', branch: 'B.Tech CSE' },
      { name: 'IT-A', branch: 'B.Tech IT' },
      { name: 'IT-B', branch: 'B.Tech IT' }
    ];
    const sections = await Section.insertMany(sectionsData);
    
    // 3. Create Faculty
    const facultyData = [
      { name: 'Dr. Ramesh Kumar', email: 'ramesh@jis.edu', password: 'faculty123', role: 'faculty' },
      { name: 'Prof. Anita Sharma', email: 'anita@jis.edu', password: 'faculty123', role: 'faculty' },
      { name: 'Dr. Vivek Singh', email: 'vivek@jis.edu', password: 'faculty123', role: 'faculty' }
    ];
    const faculty = [];
    for (const f of facultyData) {
      faculty.push(await User.create(f));
    }

    // 4. Create Subjects
    const subjectsData = [
      { name: 'DBMS', code: 'CS301', faculty: [faculty[0]._id], sections: [sections[2]._id, sections[3]._id] },
      { name: 'Operating Systems', code: 'CS302', faculty: [faculty[1]._id], sections: [sections[2]._id, sections[3]._id] },
      { name: 'Java Programming', code: 'IT301', faculty: [faculty[2]._id], sections: [sections[4]._id, sections[5]._id] },
      { name: 'Data Structures & Algorithms', code: 'BCA201', faculty: [faculty[0]._id], sections: [sections[0]._id, sections[1]._id] },
      { name: 'Computer Networks', code: 'CS401', faculty: [faculty[1]._id], sections: [sections[2]._id] },
      { name: 'Software Engineering', code: 'IT401', faculty: [faculty[2]._id], sections: [sections[4]._id] },
      { name: 'Web Development', code: 'BCA301', faculty: [faculty[1]._id], sections: [sections[0]._id, sections[1]._id] },
      { name: 'Artificial Intelligence', code: 'CS501', faculty: [faculty[0]._id], sections: [sections[3]._id] },
      { name: 'Machine Learning', code: 'IT501', faculty: [faculty[2]._id], sections: [sections[5]._id] },
      { name: 'Cloud Computing', code: 'CS601', faculty: [faculty[1]._id], sections: [sections[2]._id] }
    ];
    const subjects = await Subject.insertMany(subjectsData);

    // 5. Create Students
    const studentNames = ['Amit Patel', 'Neha Gupta', 'Rohan Desai', 'Priya Singh', 'Kabir Das', 'Sonia Reddy'];
    const students = [];
    for (let i = 0; i < studentNames.length; i++) {
        const student = await User.create({
            name: studentNames[i],
            email: `student${i+1}@jis.edu`,
            password: 'student123',
            role: 'student'
        });
        students.push(student);
        // Distribute among sections
        const section = sections[i % sections.length];
        await Section.findByIdAndUpdate(section._id, { $push: { students: student._id } });
    }

    // 6. Sample Attendance
    await Attendance.create({
        date: new Date(),
        subject: subjects[0]._id,
        section: sections[2]._id,
        student: students[2]._id, // Assuming student 3 is in CSE-A
        status: 'present',
        markedBy: faculty[0]._id
    });

    // 7. MCQ Test & Questions
    const q1 = await Question.create({
        question: 'What is a primary key?',
        options: ['A unique identifier', 'A duplicate key', 'A null value', 'None of the above'],
        correctAnswer: 'A unique identifier'
    });
    const q2 = await Question.create({
        question: 'Which of the following is not a DBMS?',
        options: ['MySQL', 'Oracle', 'Java', 'SQL Server'],
        correctAnswer: 'Java'
    });

    const test = await Test.create({
        title: 'DBMS Basics Test',
        subject: subjects[0]._id,
        section: sections[2]._id,
        duration: 30, // 30 mins
        marks: 20,
        questions: [q1._id, q2._id],
        authorId: faculty[0]._id
    });

    // 8. Result
    await Result.create({
        student: students[2]._id,
        test: test._id,
        score: 20
    });

    // 9. Assignment
    // Create a dummy pdf file for assignment
    fs.writeFileSync(path.join(process.cwd(), '../uploads/assignments/dummy-assignment.pdf'), 'Dummy PDF content');
    
    const assignment = await Assignment.create({
        title: 'ER Diagram Design',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        subject: subjects[0]._id,
        section: sections[2]._id,
        pdfFile: 'uploads/assignments/dummy-assignment.pdf',
        authorId: faculty[0]._id,
        marks: 50
    });

    // 10. Sample Submission
    fs.writeFileSync(path.join(process.cwd(), '../uploads/submissions/dummy-submission.pdf'), 'Dummy Submission content');
    
    await Submission.create({
        student: students[2]._id,
        assignment: assignment._id,
        file: 'uploads/submissions/dummy-submission.pdf',
        submittedAt: new Date(),
        grade: 45
    });

    // 11. Timetable Seeding
    const timetableData = [
        { 
            faculty: faculty[0]._id, 
            subject: subjects[0]._id, 
            section: sections[2]._id, 
            day: 'Monday', 
            startTime: '09:00', 
            endTime: '10:30' 
        },
        { 
            faculty: faculty[1]._id, 
            subject: subjects[1]._id, 
            section: sections[2]._id, 
            day: 'Tuesday', 
            startTime: '11:00', 
            endTime: '12:30' 
        },
        { 
            faculty: faculty[0]._id, 
            subject: subjects[7]._id, 
            section: sections[0]._id, 
            day: 'Wednesday', 
            startTime: '14:00', 
            endTime: '15:30' 
        }
    ];
    await Timetable.insertMany(timetableData);

    console.log('✅ Seeding complete!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
