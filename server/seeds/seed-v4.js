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

const indianFirstNames = [
  "Arav", "Vihaan", "Aditya", "Rudra", "Sai", "Vivaan", "Ishaan", "Arjun", "Karan", "Kunal",
  "Siddharth", "Rohan", "Ayush", "Dhruv", "Pranay", "Raghav", "Dev", "Neil", "Yash", "Ojas",
  "Kavya", "Diya", "Nandini", "Isha", "Aditi", "Avni", "Sneha", "Kriti", "Meera", "Swati",
  "Ananya", "Riya", "Misha", "Navya", "Tara", "Kiara", "Radhika", "Pooja", "Aarti", "Simran"
];
const indianLastNames = [
  "Nair", "Iyer", "Joshi", "Bhatt", "Chauhan", "Desai", "Goel", "Ahluwalia", "Agarwal", "Bansal",
  "Chatterjee", "Bose", "Dutta", "Garg", "Sengupta", "Yadav", "Verma", "Rathore", "Mahajan", "Dubey"
];

function getRandomName() {
  const first = indianFirstNames[Math.floor(Math.random() * indianFirstNames.length)];
  const last = indianLastNames[Math.floor(Math.random() * indianLastNames.length)];
  return { first, last, full: `${first} ${last}` };
}

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
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

    const usedEmails = new Set();
    function generateUniqueEmail(first, last, role) {
      let baseEmail = `${first.toLowerCase()}.${last.toLowerCase()}@jis.edu`;
      if (role === 'student') baseEmail = `${first.toLowerCase()}.${last.toLowerCase()}.stu@jis.edu`;
      if (role === 'faculty') baseEmail = `${first.toLowerCase()}.${last.toLowerCase()}.fac@jis.edu`;
      if (role === 'admin') baseEmail = `${first.toLowerCase()}.${last.toLowerCase()}.admin@jis.edu`;
      
      let finalEmail = baseEmail;
      let counter = 1;
      while (usedEmails.has(finalEmail)) {
        finalEmail = baseEmail.replace('@', `${counter}@`);
        counter++;
      }
      usedEmails.add(finalEmail);
      return finalEmail;
    }

    // 0. Create Admin
    const adminName = getRandomName();
    const admin = await User.create({
      name: adminName.full,
      email: generateUniqueEmail(adminName.first, adminName.last, 'admin'),
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

    // 2. Create Faculty (15 Faculties)
    const facultyList = [];
    const facultyDepartments = ['Computer Science', 'Information Technology', 'Software Engineering'];
    for(let i=0; i<15; i++) {
        const name = getRandomName();
        const fac = await User.create({
            name: name.full,
            email: generateUniqueEmail(name.first, name.last, 'faculty'),
            password: 'faculty123',
            role: 'faculty',
            roleAttr: facultyDepartments[i % facultyDepartments.length]
        });
        facultyList.push(fac);
    }

    // 3. Create Subjects & Link to Faculty/Sections
    const subjectDefinitions = [
        { name: 'DBMS', code: 'CS301', secIndices: [0, 1, 2, 3] },
        { name: 'Operating Systems', code: 'CS302', secIndices: [0, 1, 4, 5] },
        { name: 'Java Programming', code: 'IT301', secIndices: [0, 1, 4, 5] },
        { name: 'Data Structures', code: 'IT302', secIndices: [2, 3, 4, 5] },
        { name: 'Computer Networks', code: 'CS401', secIndices: [2, 3, 4, 5] },
        { name: 'Software Engineering', code: 'SE301', secIndices: [0, 1] },
        { name: 'Web Development', code: 'WD402', secIndices: [0, 1] },
        { name: 'Artificial Intelligence', code: 'AI501', secIndices: [2, 3] },
        { name: 'Machine Learning', code: 'ML502', secIndices: [2, 3] },
        { name: 'Cloud Computing', code: 'CC601', secIndices: [4, 5] }
    ];

    // Tracker to ensure every faculty member is assigned at least once
    const assignedFacultyIds = new Set();
    const facultyPool = [...facultyList];
    
    // Shuffle helper
    const shuffle = (array) => array.sort(() => Math.random() - 0.5);
    shuffle(facultyPool);

    const subjects = [];
    for (let i = 0; i < subjectDefinitions.length; i++) {
        const subDef = subjectDefinitions[i];
        const secIds = subDef.secIndices.map(idx => sections[idx]._id);
        
        // Pick primary faculty from pool if available, otherwise pick random
        let subFaculty = [];
        if (i < facultyPool.length) {
            subFaculty.push(facultyPool[i]._id);
            assignedFacultyIds.add(facultyPool[i]._id.toString());
        } else {
            const randomFac = facultyList[Math.floor(Math.random() * facultyList.length)];
            subFaculty.push(randomFac._id);
            assignedFacultyIds.add(randomFac._id.toString());
        }

        // 40% chance of having a second faculty member
        if (Math.random() > 0.6) {
           const secondFac = facultyList[Math.floor(Math.random() * facultyList.length)];
           if (secondFac._id.toString() !== subFaculty[0].toString()) {
               subFaculty.push(secondFac._id);
               assignedFacultyIds.add(secondFac._id.toString());
           }
        }

        const sub = await Subject.create({
            name: subDef.name,
            code: subDef.code,
            faculty: subFaculty,
            sections: secIds
        });
        subjects.push(sub);
    }

    // Assign any remaining faculty members who weren't picked (unlikely but safe)
    for (const fac of facultyList) {
        if (!assignedFacultyIds.has(fac._id.toString())) {
            const randomSub = subjects[Math.floor(Math.random() * subjects.length)];
            await Subject.findByIdAndUpdate(randomSub._id, { $addToSet: { faculty: fac._id } });
        }
    }

    // 4. Create Students (~20 per section -> 120 total)
    const students = [];
    for (const section of sections) {
        for (let i = 0; i < 20; i++) {
            const name = getRandomName();
            const student = await User.create({
                name: name.full,
                email: generateUniqueEmail(name.first, name.last, 'student'),
                password: 'student123',
                role: 'student',
                roleAttr: section.name
            });
            students.push({ user: student, section: section }); // store locally for fast ref
            await Section.findByIdAndUpdate(section._id, { $push: { students: student._id } });
        }
    }
    console.log(`Created ${students.length} Students`);

    // 5. Timetable Generation (Algorithmic & Collision-free)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const slots = [
        { start: '09:00', end: '10:30' },
        { start: '10:45', end: '12:15' },
        { start: '13:00', end: '14:30' },
        { start: '14:45', end: '16:15' },
        { start: '16:30', end: '18:00' }
    ];

    const timetableEntries = [];
    for (const day of days) {
        const daySchedule = [];
        for (const section of sections) {
            const sectionSubjects = subjects.filter(s => s.sections.includes(section._id));
            const shuffledSubjects = [...sectionSubjects].sort(() => 0.5 - Math.random());
            
            let classesMapped = 0;
            for (let i = 0; i < shuffledSubjects.length && classesMapped < 5; i++) {
                const sub = shuffledSubjects[i];
                // Randomly pick one of the faculty members assigned to this subject
                const randomFac = sub.faculty[Math.floor(Math.random() * sub.faculty.length)];
                const facId = randomFac.toString();
                
                // Find first available slot where both faculty and section are free
                const startSlot = Math.floor(Math.random() * 5); // randomize search start
                for (let j = 0; j < 5; j++) {
                    const slotIdx = (startSlot + j) % 5;
                    const facBusy = daySchedule.some(ds => ds.slotIdx === slotIdx && ds.facId === facId);
                    const secBusy = daySchedule.some(ds => ds.slotIdx === slotIdx && ds.section.toString() === section._id.toString());
                    
                    if (!facBusy && !secBusy) {
                        daySchedule.push({
                            slotIdx,
                            facId,
                            faculty: randomFac,
                            subject: sub._id,
                            section: section._id,
                            day: day,
                            startTime: slots[slotIdx].start,
                            endTime: slots[slotIdx].end
                        });
                        classesMapped++;
                        break; // Move to next subject
                    }
                }
            }
        }
        
        for (const ds of daySchedule) {
            timetableEntries.push({
                faculty: ds.faculty,
                subject: ds.subject,
                section: ds.section,
                day: ds.day,
                startTime: ds.startTime,
                endTime: ds.endTime
            });
        }
    }
    await Timetable.insertMany(timetableEntries);
    console.log(`Generated ${timetableEntries.length} Timetable Slots`);

    // 6. Attendance (Past 5 days)
    const today = new Date();
    const attendanceEntries = [];
    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
        const date = new Date(today);
        date.setDate(today.getDate() - dayOffset);
        date.setHours(0,0,0,0);
        
        for (const sub of subjects) {
            for (const secId of sub.sections) {
                const secStudents = students.filter(s => s.section._id.toString() === secId.toString());
                for (const student of secStudents) {
                    attendanceEntries.push({
                        date,
                        subject: sub._id,
                        section: secId,
                        student: student.user._id,
                        status: Math.random() > 0.15 ? 'present' : 'absent',
                        markedBy: sub.faculty[0]
                    });
                }
            }
        }
    }
    // Batch Insert for performance
    const chunkSize = 5000;
    for (let i = 0; i < attendanceEntries.length; i += chunkSize) {
        await Attendance.insertMany(attendanceEntries.slice(i, i + chunkSize));
    }
    console.log(`Batched inserted ${attendanceEntries.length} Attendance records`);

    // 7. Tests & Questions (2 per subject)
    const resultEntries = [];
    for (const sub of subjects) {
        for (const secId of sub.sections) {
            for (let tNum = 1; tNum <= 2; tNum++) {
                const questions = [];
                for (let qNum = 1; qNum <= 10; qNum++) {
                    const qOptions = [`Option ${Math.random().toString(36).substring(7)}`, `Option ${Math.random().toString(36).substring(7)}`, `Option ${Math.random().toString(36).substring(7)}`, `Option ${Math.random().toString(36).substring(7)}`];
                    const correctAnswer = qOptions[Math.floor(Math.random() * 4)];
                    
                    const q = await Question.create({
                        question: `Technical MCQ Question ${qNum} covering ${sub.name} concepts?`,
                        options: qOptions,
                        correctAnswer: correctAnswer
                    });
                    questions.push(q._id);
                }
                
                const test = await Test.create({
                    title: `${sub.name} Midterm ${tNum}`,
                    duration: 30, // 30 minutes
                    marks: 10 * 5, // 5 marks per question
                    dueDate: new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000)),
                    subject: sub._id,
                    section: secId,
                    questions,
                    authorId: sub.faculty[0]
                });

                // Sample scores for students
                const secStudents = students.filter(s => s.section._id.toString() === secId.toString());
                for (const student of secStudents) {
                    if (Math.random() > 0.4) {
                        resultEntries.push({ student: student.user._id, test: test._id, score: Math.floor(Math.random() * 25) + 25 });
                    }
                }
            }
        }
    }
    await Result.insertMany(resultEntries);
    console.log(`Generated Tests, Questions, and Results`);

    // 8. Assignments & Submissions
    for (const sub of subjects) {
        for (const secId of sub.sections) {
            // Create 2 assignments per subject per section
            for (let aNum = 1; aNum <= 2; aNum++) {
                const limitDays = aNum === 1 ? -2 : 14; // First assignment is overdue, second is active
                const assignment = await Assignment.create({
                    title: `${sub.name} Assignment ${aNum}`,
                    deadline: new Date(today.getTime() + (limitDays * 24 * 60 * 60 * 1000)),
                    subject: sub._id,
                    section: secId,
                    pdfFile: 'uploads/assignments/template.pdf',
                    authorId: sub.faculty[0],
                    marks: 100
                });

                const secStudents = students.filter(s => s.section._id.toString() === secId.toString());
                for (const student of secStudents) {
                    const rand = Math.random();
                    if (rand > 0.3) { 
                        await Submission.create({
                            student: student.user._id,
                            assignment: assignment._id,
                            file: 'uploads/submissions/sample.pdf',
                            submittedAt: new Date(),
                            grade: rand > 0.7 ? Math.floor(Math.random() * 40) + 60 : null
                        });
                    }
                }
            }
        }
    }
    console.log(`Generated Assignments and Submissions`);

    // Create dummy files
    fs.writeFileSync(path.join(process.cwd(), '../uploads/assignments/template.pdf'), 'Dummy PDF Data');
    fs.writeFileSync(path.join(process.cwd(), '../uploads/submissions/sample.pdf'), 'Dummy Submission Data');

    console.log('✅ Realistic High Volume Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
