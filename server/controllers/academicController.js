import mongoose from 'mongoose';
import Test from '../models/Test.js';
import Assignment from '../models/Assignment.js';
import Subject from '../models/Subject.js';
import Section from '../models/Section.js';
import Timetable from '../models/Timetable.js';
import Attendance from '../models/Attendance.js';
import Submission from '../models/Submission.js';
import Question from '../models/Question.js';

// Tests
export const getTests = async (req, res) => {
  try {
    const { subject, section } = req.query;
    let query = {};
    if (req.user.role === 'student') {
        const studentSection = await Section.findOne({ students: req.user.id });
        if (studentSection) query.section = studentSection._id;
    } else if (req.user.role === 'faculty') {
        query.authorId = req.user.id;
        if (subject) query.subject = subject;
        if (section) query.section = section;
    }
    const tests = await Test.find(query).populate('subject section', 'name code').populate('questions');
    res.json(tests);
  } catch(err) { res.status(500).json({error: err.message}); }
};

export const createTest = async (req, res) => {
  try {
    const { subject: subjectId, section: sectionId, questions } = req.body;
    if (!subjectId || !sectionId) {
        return res.status(400).json({ error: 'Subject and Section are mandatory' });
    }
    
    // Validate relationship
    const subject = await Subject.findOne({ _id: subjectId, faculty: req.user.id });
    if (!subject) return res.status(403).json({ error: 'Subject does not belong to you or does not exist.' });
    if (!subject.sections.includes(sectionId)) return res.status(400).json({ error: 'Section is not linked to this subject.' });

    let finalQuestionIds = [];
    if (questions && Array.isArray(questions)) {
        const createdQuestions = await Question.insertMany(questions);
        finalQuestionIds = createdQuestions.map(q => q._id);
    }

    const test = new Test({ ...req.body, questions: finalQuestionIds, authorId: req.user.id });
    await test.save();
    res.status(201).json(test);
  } catch(err) { res.status(500).json({error: err.message}); }
};

export const deleteTest = async (req, res) => {
  try { await Test.findByIdAndDelete(req.params.id); res.json({msg: 'Deleted'}); } catch(err) { res.status(500).json({error: err.message}); }
};

// Assignments
export const getAssignments = async (req, res) => {
  try {
    const { subject, section } = req.query;
    let query = {};
    if (req.user.role === 'student') {
        const studentSection = await Section.findOne({ students: req.user.id });
        if (studentSection) query.section = studentSection._id;
    } else if (req.user.role === 'faculty') {
        query.authorId = req.user.id;
        if (subject) query.subject = subject;
        if (section) query.section = section;
    }
    const assignments = await Assignment.find(query).populate('subject section', 'name code');
    res.json(assignments);
  } catch(err) { res.status(500).json({error: err.message}); }
};

export const createAssignment = async (req, res) => {
  try {
    const { subject: subjectId, section: sectionId } = req.body;
    if (!subjectId || !sectionId) {
        return res.status(400).json({ error: 'Subject and Section are mandatory' });
    }

    // Validate relationship
    const subject = await Subject.findOne({ _id: subjectId, faculty: req.user.id });
    if (!subject) return res.status(403).json({ error: 'Subject does not belong to you or does not exist.' });
    if (!subject.sections.includes(sectionId)) return res.status(400).json({ error: 'Section is not linked to this subject.' });

    const assignmentData = { ...req.body, authorId: req.user.id };
    if (req.file) {
      assignmentData.pdfFile = 'uploads/assignments/' + req.file.filename;
    }
    
    const assignment = new Assignment(assignmentData);
    await assignment.save();
    
    const io = req.app.get('io');
    if (io) {
      io.to('student').emit('new_assignment', assignment);
    }
    res.status(201).json(assignment);
  } catch(err) { res.status(500).json({error: err.message}); }
};

export const deleteAssignment = async (req, res) => {
  try { await Assignment.findByIdAndDelete(req.params.id); res.json({msg: 'Deleted'}); } catch(err) { res.status(500).json({error: err.message}); }
};

// Subjects
export const getSubjects = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
        const section = await Section.findOne({ students: req.user.id });
        if (section) query.sections = section._id;
    }
    const subjects = await Subject.find(query).populate('faculty sections', 'name email');
    res.json(subjects);
  } catch(err) { res.status(500).json({error: err.message}); }
};

export const getMySubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ faculty: req.user.id })
      .populate({
        path: 'sections',
        select: 'name branch students',
        populate: {
          path: 'students',
          select: 'name email'
        }
      });
    res.json(subjects);
  } catch(err) { res.status(500).json({error: err.message}); }
};

export const createSubject = async (req, res) => {
  try { const subject = new Subject(req.body); await subject.save(); res.status(201).json(subject); } catch(err) { res.status(500).json({error: err.message}); }
};

export const deleteSubject = async (req, res) => {
  try { await Subject.findByIdAndDelete(req.params.id); res.json({msg: 'Deleted'}); } catch(err) { res.status(500).json({error: err.message}); }
};

// Sections
export const getSections = async (req, res) => {
  try { res.json(await Section.find().populate('students', 'name email')); } catch(err) { res.status(500).json({error: err.message}); }
};

export const getMySections = async (req, res) => {
  try {
    const subjects = await Subject.find({ faculty: req.user.id });
    const sectionIds = [...new Set(subjects.flatMap(s => s.sections))];
    const sections = await Section.find({ _id: { $in: sectionIds } });
    res.json(sections);
  } catch(err) { res.status(500).json({error: err.message}); }
};

export const createSection = async (req, res) => {
  try { const section = new Section(req.body); await section.save(); res.status(201).json(section); } catch(err) { res.status(500).json({error: err.message}); }
};

export const deleteSection = async (req, res) => {
  try { await Section.findByIdAndDelete(req.params.id); res.json({msg: 'Deleted'}); } catch(err) { res.status(500).json({error: err.message}); }
};

// Timetable
export const getFacultyTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.find({ faculty: new mongoose.Types.ObjectId(req.user.id) })
      .populate('faculty subject section', 'name code')
      .sort({ day: 1, startTime: 1 });
    res.json(timetable);
  } catch(err) { res.status(500).json({error: err.message}); }
};

export const getStudentTimetable = async (req, res) => {
  try {
    // Determine student's section by finding the section that contains student's ID
    let section = await Section.findOne({ students: req.user.id });
    
    // Fallback: If not in students array, check if roleAttr matches section name
    if (!section && req.user.roleAttr) {
        section = await Section.findOne({ name: req.user.roleAttr });
    }

    if (!section) return res.status(404).json({ error: 'Section not found for student' });

    const timetable = await Timetable.find({ section: section._id })
      .populate('faculty subject section', 'name code')
      .sort({ day: 1, startTime: 1 });
    res.json(timetable);
  } catch(err) { res.status(500).json({error: err.message}); }
};

export const getTimetable = async (req, res) => {
  try {
    const { section, faculty } = req.query;
    let query = {};
    if (section) query.section = section;
    if (faculty) query.faculty = faculty;

    const timetable = await Timetable.find(query)
      .populate('faculty subject section', 'name code')
      .sort({ day: 1, startTime: 1 });
    res.json(timetable);
  } catch(err) { res.status(500).json({error: err.message}); }
};

export const createTimetable = async (req, res) => {
  try { 
    const { day, startTime, endTime, faculty, section, subject, room, sessionType } = req.body;
    
    // Convert string time "HH:mm" to comparable values (or just rely on string comparison if well formatted)
    // Check faculty conflict
    const facultyConflict = await Timetable.findOne({
      faculty,
      day,
      $and: [
        { startTime: { $lt: endTime } },
        { endTime: { $gt: startTime } }
      ]
    });
    if (facultyConflict) return res.status(400).json({ error: 'Faculty is already scheduled at this time.' });

    // Check section conflict
    const sectionConflict = await Timetable.findOne({
      section,
      day,
      $and: [
        { startTime: { $lt: endTime } },
        { endTime: { $gt: startTime } }
      ]
    });
    if (sectionConflict) return res.status(400).json({ error: 'Section already has a schedule at this time.' });

    const tt = new Timetable(req.body); 
    await tt.save(); 
    const populatedTt = await Timetable.findById(tt._id).populate('faculty subject section', 'name');
    res.status(201).json(populatedTt); 
  } catch(err) { res.status(500).json({error: err.message}); }
};

export const updateTimetableSlot = async (req, res) => {
  try {
    const { day, startTime, endTime, faculty, section, subject, room, sessionType } = req.body;
    const existing = await Timetable.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Slot not found' });

    const checkDay = day || existing.day;
    const checkStartTime = startTime || existing.startTime;
    const checkEndTime = endTime || existing.endTime;
    const checkFaculty = faculty || existing.faculty;
    const checkSection = section || existing.section;

    const facultyConflict = await Timetable.findOne({ 
      faculty: checkFaculty, 
      day: checkDay, 
      _id: { $ne: req.params.id },
      $and: [
        { startTime: { $lt: checkEndTime } },
        { endTime: { $gt: checkStartTime } }
      ]
    });
    if (facultyConflict) return res.status(400).json({ error: 'Faculty is already scheduled at this time.' });

    const sectionConflict = await Timetable.findOne({ 
      section: checkSection, 
      day: checkDay, 
      _id: { $ne: req.params.id },
      $and: [
        { startTime: { $lt: checkEndTime } },
        { endTime: { $gt: checkStartTime } }
      ]
    });
    if (sectionConflict) return res.status(400).json({ error: 'Section already has a schedule at this time.' });

    const updated = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('faculty subject section', 'name');
    res.json(updated);
  } catch(err) { res.status(500).json({error: err.message}); }
};

export const deleteTimetable = async (req, res) => {
  try { await Timetable.findByIdAndDelete(req.params.id); res.json({msg: 'Deleted'}); } catch(err) { res.status(500).json({error: err.message}); }
};

// Attendance
export const getAttendance = async (req, res) => {
  try {
    const { date, subject, section, subjectId, sectionId, studentId } = req.query;
    let query = {};
    if (date) {
        const start = new Date(date);
        start.setHours(0,0,0,0);
        const end = new Date(date);
        end.setHours(23,59,59,999);
        query.date = { $gte: start, $lte: end };
    }
    const subj = subject || subjectId;
    const sec = section || sectionId;
    
    if (subj) query.subject = subj;
    if (sec) query.section = sec;
    if (studentId) query.student = studentId;

    const attendance = await Attendance.find(query)
        .populate('student markedBy subject section', 'name email code')
        .sort({ date: -1 });
    res.json(attendance);
  } catch(err) { res.status(500).json({error: err.message}); }
};

export const markAttendance = async (req, res) => {
  try {
    const { date, subject: subjectId, section: sectionId, markedBy, attendances } = req.body; // array [{studentId, status}]
    if (!subjectId || !sectionId) {
        return res.status(400).json({ error: 'Subject and Section are mandatory' });
    }

    // Validate relationship
    const subject = await Subject.findOne({ _id: subjectId, faculty: req.user.id });
    if (!subject) return res.status(403).json({ error: 'Subject does not belong to you or does not exist.' });
    if (!subject.sections.includes(sectionId)) return res.status(400).json({ error: 'Section is not linked to this subject.' });

    const results = [];
    
    // Normalize date to midnight for consistency
    const targetDate = new Date(date);
    targetDate.setHours(0,0,0,0);

    for (let att of attendances) {
      let record = await Attendance.findOneAndUpdate(
        { date: targetDate, subject: subjectId, section: sectionId, student: att.studentId },
        { status: att.status, markedBy: markedBy },
        { upsert: true, new: true }
      );
      results.push(record);
    }
    res.json({ message: 'Attendance marked successfully', count: results.length });
  } catch(err) { res.status(500).json({error: err.message}); }
};

// Submissions
export const getSubmissions = async (req, res) => {
  try {
    const { assignmentId, studentId, facultyId } = req.query;
    let query = {};
    
    if (assignmentId) {
      query.assignment = assignmentId;
    } else if (studentId) {
      query.student = studentId;
    } else if (facultyId) {
      // Find assignments and tests created by this faculty
      const myAssignments = await Assignment.find({ authorId: facultyId }).select('_id');
      const myTests = await Test.find({ authorId: facultyId }).select('_id');
      const ids = [...myAssignments.map(a => a._id), ...myTests.map(t => t._id)];
      query = { $or: [{ assignment: { $in: ids } }, { testId: { $in: ids } }] };
    }

    const subs = await Submission.find(query)
      .populate('assignment student testId', 'title name')
      .sort({ createdAt: -1 });
    res.json(subs);
  } catch(err) { res.status(500).json({error: err.message}); }
};

export const createSubmission = async (req, res) => {
  try { 
    const submission = new Submission({ ...req.body, file: req.file ? req.file.path : null });
    await submission.save(); 

    let targetFacultyId = null;
    if (submission.assignment) {
      const parentAssignment = await Assignment.findById(submission.assignment);
      if (parentAssignment) targetFacultyId = parentAssignment.authorId;
    } else if (submission.testId) {
      const parentTest = await Test.findById(submission.testId);
      if (parentTest) targetFacultyId = parentTest.authorId;
    }

    const io = req.app.get('io');
    if (io && targetFacultyId) {
      io.to(`user_${targetFacultyId.toString()}`).emit('new_submission', submission);
    }

    res.status(201).json(submission); 
  } catch(err) { res.status(500).json({error: err.message}); }
};

export const updateSubmission = async (req, res) => {
  try { 
    const submission = await Submission.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignment student');
    res.json(submission); 
  } catch(err) { res.status(500).json({error: err.message}); }
};
