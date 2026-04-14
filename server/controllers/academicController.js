import Test from '../models/Test.js';
import Assignment from '../models/Assignment.js';
import Course from '../models/Course.js';
import Timetable from '../models/Timetable.js';
import Attendance from '../models/Attendance.js';
import Submission from '../models/Submission.js';

// Existing Tests
export const getTests = async (req, res) => {
  try { res.json(await Test.find()); } catch(err) { res.status(500).json({error: err.message}); }
};

export const createTest = async (req, res) => {
  try { const test = new Test(req.body); await test.save(); res.status(201).json(test); } catch(err) { res.status(500).json({error: err.message}); }
};

export const deleteTest = async (req, res) => {
  try { await Test.findByIdAndDelete(req.params.id); res.json({msg: 'Deleted'}); } catch(err) { res.status(500).json({error: err.message}); }
};

// Existing Assignments
export const getAssignments = async (req, res) => {
  try { res.json(await Assignment.find()); } catch(err) { res.status(500).json({error: err.message}); }
};

export const createAssignment = async (req, res) => {
  try { 
    const assignment = new Assignment(req.body); 
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

// Courses
export const getCourses = async (req, res) => {
  try { res.json(await Course.find().populate('students faculty', 'name email roleAttr')); } catch(err) { res.status(500).json({error: err.message}); }
};

export const createCourse = async (req, res) => {
  try { const course = new Course(req.body); await course.save(); res.status(201).json(course); } catch(err) { res.status(500).json({error: err.message}); }
};

export const deleteCourse = async (req, res) => {
  try { await Course.findByIdAndDelete(req.params.id); res.json({msg: 'Deleted'}); } catch(err) { res.status(500).json({error: err.message}); }
};

// Timetable
export const getTimetable = async (req, res) => {
  try {
    const { roleAttr } = req.query; // course for student, dept for faculty
    let timetable;
    if (roleAttr) {
      timetable = await Timetable.find({}).populate('teacherId classId', 'name');
    } else {
      timetable = await Timetable.find({}).populate('teacherId classId', 'name');
    }
    res.json(timetable);
  } catch(err) { res.status(500).json({error: err.message}); }
};

export const createTimetable = async (req, res) => {
  try { 
    const { day, period, teacherId, classId, room } = req.body;
    const teacherConflict = await Timetable.findOne({ day, period, teacherId });
    if (teacherConflict) return res.status(400).json({ error: 'Teacher is already scheduled at this time.' });

    const roomConflict = await Timetable.findOne({ day, period, room });
    if (roomConflict) return res.status(400).json({ error: 'Room is already booked at this time.' });

    const classConflict = await Timetable.findOne({ day, period, classId });
    if (classConflict) return res.status(400).json({ error: 'Class already has a schedule at this time.' });

    const tt = new Timetable(req.body); 
    await tt.save(); 
    const populatedTt = await Timetable.findById(tt._id).populate('teacherId classId', 'name');
    res.status(201).json(populatedTt); 
  } catch(err) { res.status(500).json({error: err.message}); }
};

export const updateTimetableSlot = async (req, res) => {
  try {
    const { day, period, teacherId, classId, room } = req.body;
    const existing = await Timetable.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Slot not found' });

    const checkDay = day || existing.day;
    const checkPeriod = period || existing.period;
    const checkTeacherId = teacherId || existing.teacherId;
    const checkClassId = classId || existing.classId;
    const checkRoom = room || existing.room;

    const teacherConflict = await Timetable.findOne({ day: checkDay, period: checkPeriod, teacherId: checkTeacherId, _id: { $ne: req.params.id } });
    if (teacherConflict) return res.status(400).json({ error: 'Teacher is already scheduled at this time.' });

    const roomConflict = await Timetable.findOne({ day: checkDay, period: checkPeriod, room: checkRoom, _id: { $ne: req.params.id } });
    if (roomConflict) return res.status(400).json({ error: 'Room is already booked at this time.' });
    
    const classConflict = await Timetable.findOne({ day: checkDay, period: checkPeriod, classId: checkClassId, _id: { $ne: req.params.id } });
    if (classConflict) return res.status(400).json({ error: 'Class already has a schedule at this time.' });

    const updated = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('teacherId classId', 'name');
    res.json(updated);
  } catch(err) { res.status(500).json({error: err.message}); }
};

export const deleteTimetable = async (req, res) => {
  try { await Timetable.findByIdAndDelete(req.params.id); res.json({msg: 'Deleted'}); } catch(err) { res.status(500).json({error: err.message}); }
};

// Attendance
export const getAttendance = async (req, res) => {
  try {
    const { date, classId, studentId } = req.query;
    let query = {};
    if (date) {
        const start = new Date(date);
        start.setHours(0,0,0,0);
        const end = new Date(date);
        end.setHours(23,59,59,999);
        query.date = { $gte: start, $lte: end };
    }
    if (classId) query.classId = classId;
    if (studentId) query.studentId = studentId;

    const attendance = await Attendance.find(query)
        .populate('studentId markedBy classId', 'name email roleAttr')
        .sort({ date: -1 });
    res.json(attendance);
  } catch(err) { res.status(500).json({error: err.message}); }
};

export const markAttendance = async (req, res) => {
  try {
    const { date, classId, markedBy, attendances } = req.body; // array [{studentId, status}]
    const results = [];
    
    // Normalize date to midnight for consistency
    const targetDate = new Date(date);
    targetDate.setHours(0,0,0,0);

    for (let att of attendances) {
      let record = await Attendance.findOneAndUpdate(
        { date: targetDate, classId: classId, studentId: att.studentId },
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
      query.assignmentId = assignmentId;
    } else if (studentId) {
      query.studentId = studentId;
    } else if (facultyId) {
      // Find assignments and tests created by this faculty
      const myAssignments = await Assignment.find({ authorId: facultyId }).select('_id');
      const myTests = await Test.find({ authorId: facultyId }).select('_id');
      const ids = [...myAssignments.map(a => a._id), ...myTests.map(t => t._id)];
      query = { $or: [{ assignmentId: { $in: ids } }, { testId: { $in: ids } }] };
    }

    const subs = await Submission.find(query)
      .populate('assignmentId studentId testId', 'title name')
      .sort({ createdAt: -1 });
    res.json(subs);
  } catch(err) { res.status(500).json({error: err.message}); }
};

export const createSubmission = async (req, res) => {
  try { 
    const submission = new Submission({ ...req.body, filePath: req.file ? req.file.path : null });
    await submission.save(); 

    let targetFacultyId = null;
    if (submission.assignmentId) {
      const parentAssignment = await Assignment.findById(submission.assignmentId);
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
      .populate('assignmentId studentId');
    res.json(submission); 
  } catch(err) { res.status(500).json({error: err.message}); }
};
