import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Subject from './models/Subject.js';
import Section from './models/Section.js';
import Timetable from './models/Timetable.js';

dotenv.config();

const seedTimetable = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const faculties = await User.find({ role: 'faculty' });
        const subjects = await Subject.find();
        const sections = await Section.find();

        if (faculties.length === 0 || subjects.length === 0 || sections.length === 0) {
            console.log('Insufficient data (faculty, subjects, or sections) to create timetable.');
            process.exit(1);
        }

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const slots = [
            { start: '09:15', end: '10:15' },
            { start: '10:15', end: '11:15' },
            { start: '11:15', end: '12:15' },
            { start: '13:00', end: '14:00' },
            { start: '14:00', end: '15:00' }
        ];

        let timetableCount = 0;

        for (const section of sections) {
            for (const day of days) {
                // For each section, pick 2-3 random slots/subjects/faculties per day
                const numSlots = Math.floor(Math.random() * 3) + 2; 
                const shuffledSlots = [...slots].sort(() => 0.5 - Math.random());
                const selectedSlots = shuffledSlots.slice(0, numSlots);

                for (const slot of selectedSlots) {
                    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
                    const randomFaculty = faculties[Math.floor(Math.random() * faculties.length)];
                    
                    await Timetable.create({
                        faculty: randomFaculty._id,
                        subject: randomSubject._id,
                        section: section._id,
                        day,
                        startTime: slot.start,
                        endTime: slot.end,
                        room: `Room ${Math.floor(Math.random() * 500) + 100}`,
                        sessionType: Math.random() > 0.8 ? 'Lab' : 'Lecture'
                    });
                    timetableCount++;
                }
            }
        }

        console.log(`Successfully added ${timetableCount} timetable entries.`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding timetable:', error);
        process.exit(1);
    }
};

seedTimetable();
