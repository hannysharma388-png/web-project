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

    // Create required directories
    ['../uploads/assignments', '../uploads/submissions'].forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
    });

    // 0. Create Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@jis.edu',
      password: 'admin123',
      role: 'admin'
    });
    console.log('Admin created:', admin.email);

    // 1. Create Sections
    const sectionsData = [
      { name: 'BCA-A', branch: 'BCA' }, { name: 'BCA-B', branch: 'BCA' },
      { name: 'CSE-A', branch: 'B.Tech CSE' }, { name: 'CSE-B', branch: 'B.Tech CSE' },
      { name: 'IT-A', branch: 'B.Tech IT' }, { name: 'IT-B', branch: 'B.Tech IT' }
    ];
    const sections = await Section.insertMany(sectionsData);

    // 2. Create Faculty
    const facultyData = [
      { name: 'Dr. Ramesh Kumar', email: 'ramesh@jis.edu', password: 'faculty123', role: 'faculty', roleAttr: 'Computer Science' },
      { name: 'Prof. Anita Sharma', email: 'anita@jis.edu', password: 'faculty123', role: 'faculty', roleAttr: 'Information Technology' },
      { name: 'Dr. Vivek Singh', email: 'vivek@jis.edu', password: 'faculty123', role: 'faculty', roleAttr: 'Computer Science' }
    ];
    const faculty = [];
    for (const f of facultyData) {
      faculty.push(await User.create(f));
    }

    // 3. Create Subjects & Link to Faculty/Sections
    const subjectsData = [
      { name: 'DBMS', code: 'CS301', faculty: [faculty[0]._id], sections: [sections[0]._id] },
      { name: 'Operating Systems', code: 'CS302', faculty: [faculty[0]._id], sections: [sections[1]._id] },
      { name: 'Java Programming', code: 'IT301', faculty: [faculty[1]._id], sections: [sections[2]._id] },
      { name: 'Data Structures', code: 'IT302', faculty: [faculty[1]._id], sections: [sections[3]._id] },
      { name: 'Computer Networks', code: 'CS401', faculty: [faculty[2]._id], sections: [sections[4]._id] },
      { name: 'Web Development', code: 'CS402', faculty: [faculty[2]._id], sections: [sections[5]._id] }
    ];
    const subjects = await Subject.insertMany(subjectsData);

    // 4. Create Students (12)
    const students = [];
    const names = ['Amit', 'Neha', 'Rohan', 'Priya', 'Kabir', 'Sonia', 'Vikram', 'Anjali', 'Arjun', 'Isha', 'Reyansh', 'Diya'];
    const surnames = ['Patel', 'Gupta', 'Singh', 'Reddy', 'Das', 'Sen'];
    
    for (let i = 0; i < 12; i++) {
        const section = sections[i % 6];
        const firstName = names[i];
        const lastName = surnames[i % 6];
        const fullName = `${firstName} ${lastName}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@jis.edu`;

        const student = await User.create({
            name: fullName,
            email: email,
            password: 'student123',
            role: 'student',
            roleAttr: section.name
        });
        students.push(student);
        await Section.findByIdAndUpdate(section._id, { $push: { students: student._id } });
    }

    // 5. Attendance (Past 5 days)
    const today = new Date();
    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
        const date = new Date(today);
        date.setDate(today.getDate() - dayOffset);
        date.setHours(0,0,0,0);
        
        for (const sub of subjects) {
            for (const secId of sub.sections) {
                const secStudents = students.filter(s => s.roleAttr === sectionsData.find(sd => sd.name === sections.find(s_ => s_._id.toString() === secId.toString()).name).name);
                for (const student of secStudents) {
                    await Attendance.create({
                        date,
                        subject: sub._id,
                        section: secId,
                        student: student._id,
                        status: Math.random() > 0.1 ? 'present' : 'absent',
                        markedBy: sub.faculty[0]
                    });
                }
            }
        }
    }

    // 6. Tests & Questions (2 per subject)
    for (const sub of subjects) {
        for (const secId of sub.sections) {
            for (let tNum = 1; tNum <= 2; tNum++) {
                const questions = [];
                for (let qNum = 1; qNum <= 5; qNum++) {
                    const q = await Question.create({
                        question: `Question ${qNum} for ${sub.name} Quiz ${tNum}?`,
                        options: ['Option A', 'Option B', 'Option C', 'Option D'],
                        correctAnswer: 'Option A'
                    });
                    questions.push(q._id);
                }
                
                const test = await Test.create({
                    title: `${sub.name} Midterm ${tNum}`,
                    duration: 30,
                    marks: 25,
                    dueDate: new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000)),
                    subject: sub._id,
                    section: secId,
                    questions,
                    authorId: sub.faculty[0]
                });

                // Sample scores for students in this section
                const secStudents = students.filter(s => s.roleAttr === sections.find(s_ => s_._id.toString() === secId.toString()).name);
                for (const student of secStudents) {
                    if (Math.random() > 0.3) {
                        await Result.create({ student: student._id, test: test._id, score: Math.floor(Math.random() * 25) });
                    }
                }
            }
        }
    }

    // 7. Assignments & Submissions
    for (const sub of subjects) {
        for (const secId of sub.sections) {
            const assignment = await Assignment.create({
                title: `${sub.name} Final Project`,
                deadline: new Date(today.getTime() + (14 * 24 * 60 * 60 * 1000)),
                subject: sub._id,
                section: secId,
                pdfFile: 'uploads/assignments/template.pdf',
                authorId: sub.faculty[0],
                marks: 100
            });

            const secStudents = students.filter(s => s.roleAttr === sections.find(s_ => s_._id.toString() === secId.toString()).name);
            for (const student of secStudents) {
                const rand = Math.random();
                if (rand > 0.3) { // 70% submit
                    await Submission.create({
                        student: student._id,
                        assignment: assignment._id,
                        file: 'uploads/submissions/sample.pdf',
                        submittedAt: rand > 0.5 ? new Date() : new Date(today.getTime() + (15 * 24 * 60 * 60 * 1000)), // some late
                        grade: rand > 0.8 ? Math.floor(Math.random() * 100) : null
                    });
                }
            }
        }
    }

    // 8. Timetable
    for (const sub of subjects) {
        for (const secId of sub.sections) {
            await Timetable.create({
                faculty: sub.faculty[0],
                subject: sub._id,
                section: secId,
                day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][Math.floor(Math.random() * 5)],
                startTime: '10:00',
                endTime: '11:30'
            });
        }
    }

    // Create dummy files
    fs.writeFileSync(path.join(process.cwd(), '../uploads/assignments/template.pdf'), 'Dummy PDF');
    fs.writeFileSync(path.join(process.cwd(), '../uploads/submissions/sample.pdf'), 'Dummy Submission');

    console.log('✅ Realistic Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
