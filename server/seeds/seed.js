import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Timetable from '../models/Timetable.js';
import Attendance from '../models/Attendance.js';
import Assignment from '../models/Assignment.js';
import Test from '../models/Test.js';
import Notice from '../models/Notice.js';
import bcrypt from 'bcrypt';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/college');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Timetable.deleteMany({});
    await Attendance.deleteMany({});
    await Assignment.deleteMany({});
    await Test.deleteMany({});
    await Notice.deleteMany({});

    // 1. Create Admin (Model middleware handles hashing)
    const adminData = {
      name: 'Harshit Sharma',
      email: 'harshit.sharma@jis.edu',
      password: 'admin123',
      role: 'admin',
      roleAttr: ''
    };
    const admin = await User.create(adminData);
    console.log(`Admin created: ${admin.email} / admin123`);

    // 2. Create Faculty (Model middleware handles hashing)
    const facultyData = [
      { name: 'Dr. Rajesh Kumar', email: 'rajesh.kumar@jis.edu', password: 'college123', role: 'faculty', roleAttr: 'CSE' },
      { name: 'Prof. Priya Sharma', email: 'priya.sharma@jis.edu', password: 'college123', role: 'faculty', roleAttr: 'CSE' },
      { name: 'Dr. Amit Singh', email: 'amit.singh@jis.edu', password: 'college123', role: 'faculty', roleAttr: 'CSE' },
      { name: 'Prof. Neha Gupta', email: 'neha.gupta@jis.edu', password: 'college123', role: 'faculty', roleAttr: 'ECE' },
      { name: 'Dr. Vikram Joshi', email: 'vikram.joshi@jis.edu', password: 'college123', role: 'faculty', roleAttr: 'ECE' },
      { name: 'Prof. Meera Patel', email: 'meera.patel@jis.edu', password: 'college123', role: 'faculty', roleAttr: 'MECH' },
      { name: 'Dr. Anil Verma', email: 'anil.verma@jis.edu', password: 'college123', role: 'faculty', roleAttr: 'CSE' },
      { name: 'Prof. Sita Devi', email: 'sita.devi@jis.edu', password: 'college123', role: 'faculty', roleAttr: 'ECE' },
      { name: 'Dr. Rohan Desai', email: 'rohan.desai@jis.edu', password: 'college123', role: 'faculty', roleAttr: 'MECH' },
      { name: 'Prof. Kavya Reddy', email: 'kavya.reddy@jis.edu', password: 'college123', role: 'faculty', roleAttr: 'CSE' }
    ];
    
    const faculty = [];
    for (let f of facultyData) {
      faculty.push(await User.create(f));
    }

    // 3. Create Courses
    const courses = await Course.insertMany([
      { name: 'Data Structures', code: 'CSE101', students: [], faculty: [faculty[0]._id, faculty[1]._id] },
      { name: 'Algorithms', code: 'CSE102', students: [], faculty: [faculty[1]._id, faculty[2]._id] },
      { name: 'Digital Electronics', code: 'ECE201', students: [], faculty: [faculty[3]._id] },
      { name: 'Microprocessors', code: 'ECE202', students: [], faculty: [faculty[3]._id, faculty[4]._id] },
      { name: 'Thermodynamics', code: 'MECH301', students: [], faculty: [faculty[5]._id] }
    ]);

// 4. Create Students (20 per course, Indian names, unique emails, common password 'college123')
    const indianNames = [
      'Aarav Sharma', 'Aanya Gupta', 'Vihaan Singh', 'Diya Patel', 'Arjun Reddy', 'Anaya Joshi',
      'Reyansh Kumar', 'Saisha Verma', 'Ishaan Desai', 'Kiara Nair', 'Aditya Rao', 'Myra Khan',
      'Kabir Malhotra', 'Riya Iyer', 'Rudra Bhatia', 'Tara Mishra', 'Vivaan Agarwal', 'Zara Khan',
      'Yash Mehra', 'Saanvi Kapoor', 'Om Yadav', 'Avani Jain', 'Tejas Pandey', 'Nia Choudhary',
      'Devansh Saxena', 'Esha Thakur', 'Kian Bose', 'Lila Sen', 'Mohan Das', 'Naina Roy',
      'Parth Pawar', 'Qadira Ali', 'Rishi Bhatt', 'Saanika More', 'Utkarsh Gaikwad', 'Veda Shetty',
      'Xavier Lobo', 'Yamini Salvi', 'Zayan Parkar', 'Aishani Dalvi',
      'Amit Kumar', 'Anjali Sharma', 'Bhavin Patel', 'Bhumika Desai', 'Chetan Bhagat', 'Chhaya Singh',
      'Darshan Raval', 'Deepika Padukone', 'Eklavya Singh', 'Ekta Kapoor', 'Farhan Akhtar', 'Fatima Sana',
      'Gaurav Taneja', 'Gauri Khan', 'Harsh Kapoor', 'Hina Khan', 'Imran Hashmi', 'Ileana Cruz',
      'Jatin Sapru', 'Janhvi Kapoor', 'Karan Johar', 'Karisma Kapoor', 'Lakshya Sen', 'Lata Mangeshkar',
      'Manish Malhotra', 'Madhuri Dixit', 'Naveen Patnaik', 'Neha Kakkar', 'Omkar Kapoor', 'Oshin Brar',
      'Prateek Kuhad', 'Priyanka Chopra', 'Qazi Touqeer', 'Qurat Balouch', 'Rahul Dravid', 'Rani Mukerji',
      'Sahil Khan', 'Sushmita Sen', 'Tarun Tahiliani', 'Twinkle Khanna', 'Uday Chopra', 'Urvashi Rautela',
      'Varun Dhawan', 'Vidya Balan', 'Wajid Khan', 'Waheeda Rehman', 'Yuvraj Singh', 'Yami Gautam',
      'Zayed Khan', 'Zarine Khan', 'Ankit Tiwari', 'Aditi Rao', 'Meera Rajput', 'Bipasha Basu',
      'Chunky Panday', 'Chitra Singh', 'Diljit Dosanjh', 'Disha Patani', 'Emraan Hashmi', 'Elli Avram'
    ];
    const students = [];
    const studentEmails = [];
    const allStudents = [];
    for (let c = 0; c < courses.length; c++) {
      for (let s = 0; s < 20; s++) {
        const idx = c * 20 + s;
        const name = indianNames[idx];
        const rollNo = String(s + 1).padStart(2, '0');
        const email = `${name.toLowerCase().split(' ').join('.')}@jis.edu`;
        studentEmails.push(email);
        students.push({
          name,
          email,
          password: 'college123',
          role: 'student',
          roleAttr: courses[c].code
        });
      }
    }
    const insertedStudents = [];
    for (let s of students) {
      insertedStudents.push(await User.create(s));
    }
    allStudents.push(...insertedStudents);

    // Distribute students to courses (20 each)
    let studentOffset = 0;
    for (let c = 0; c < courses.length; c++) {
      const courseStudents = allStudents.slice(studentOffset, studentOffset + 20).map(s => s._id);
      await Course.findByIdAndUpdate(courses[c]._id, { $set: { students: courseStudents } });
      studentOffset += 20;
    }

    // 5. Expanded Timetables (more slots, assigned to new faculty)
    await Timetable.insertMany([
      { day: 'Monday', period: 1, subject: 'Data Structures', classId: courses[0]._id, teacherId: faculty[0]._id, room: 'A101' },
      { day: 'Monday', period: 3, subject: 'Algorithms', classId: courses[1]._id, teacherId: faculty[2]._id, room: 'A102' },
      { day: 'Tuesday', period: 2, subject: 'Digital Electronics', classId: courses[2]._id, teacherId: faculty[3]._id, room: 'B201' },
      { day: 'Tuesday', period: 4, subject: 'Microprocessors', classId: courses[3]._id, teacherId: faculty[4]._id, room: 'B202' },
      { day: 'Wednesday', period: 1, subject: 'Thermodynamics', classId: courses[4]._id, teacherId: faculty[5]._id, room: 'C301' },
      { day: 'Thursday', period: 2, subject: 'Data Structures Lab', classId: courses[0]._id, teacherId: faculty[6]._id, room: 'Lab1' },
      { day: 'Friday', period: 3, subject: 'Microprocessors Lab', classId: courses[3]._id, teacherId: faculty[7]._id, room: 'Lab2' }
    ]);

    // 6. More Assignments assigned to faculty
    await Assignment.insertMany([
      { title: 'Binary Tree Implementation', authorId: faculty[0]._id, marks: 20, dueDate: new Date('2024-12-01') },
      { title: 'Sorting Algorithm Analysis', authorId: faculty[1]._id, marks: 25, dueDate: new Date('2024-12-05') },
      { title: 'Circuit Design Project', authorId: faculty[3]._id, marks: 30, dueDate: new Date('2024-12-10') },
      { title: 'Heat Transfer Simulation', authorId: faculty[5]._id, marks: 25, dueDate: new Date('2024-12-08') },
      { title: 'Assembly Language Program', authorId: faculty[4]._id, marks: 20, dueDate: new Date('2024-12-03') },
      { title: 'Database Design', authorId: faculty[6]._id, marks: 15, dueDate: new Date('2024-11-30') }
    ]);

    // 8. Add Tests
    await Test.insertMany([
      { title: 'Data Structures Quiz 1', authorId: faculty[0]._id, marks: 50, duration: 30, dueDate: new Date('2024-11-20') },
      { title: 'Algorithm Mid-Term', authorId: faculty[1]._id, marks: 100, duration: 60, dueDate: new Date('2024-11-25') },
      { title: 'Digital Logic Test', authorId: faculty[3]._id, marks: 25, duration: 20, dueDate: new Date('2024-11-22') }
    ]);

    // 9. Add Notices
    await Notice.insertMany([
      { title: 'End Semester Exams', content: 'The end semester examinations will commence from December 15th, 2024. Please check the website for the detailed schedule.', authorId: admin._id },
      { title: 'Library Renovation', content: 'The central library will be closed for renovation from November 20th to November 25th.', authorId: admin._id },
      { title: 'Cultural Fest 2024', content: 'Registration for the annual cultural fest is now open. Interested students can register at the student council office.', authorId: admin._id }
    ]);

    console.log('✅ Seeding complete!');
    // Print full lists
    console.log('\\n=== FACULTY LIST ===');
    faculty.forEach(f => console.log(`${f.name} (${f.email}/college123) - ${f.roleAttr}`));
    console.log('\\n=== STUDENT LISTS (20 per course, /college123) ===');
    for (let c = 0; c < courses.length; c++) {
      console.log(`\\n${courses[c].code}:`);
      for (let s = c*20; s < (c+1)*20 && s < studentEmails.length; s++) {
        console.log(`  ${students[s].name} (${studentEmails[s]})`);
      }
    }
    console.log('\\n✅ Seeding complete! Total Students:', allStudents.length, 'Faculty:', faculty.length);
    mongoose.connection.close();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();

