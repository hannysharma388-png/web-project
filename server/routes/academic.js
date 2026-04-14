import express from 'express';
import multer from 'multer';
import path from 'path';
import { 
  getTests, createTest, deleteTest,
  getAssignments, createAssignment, deleteAssignment,
  getSubjects, getMySubjects, createSubject, deleteSubject,
  getSections, getMySections, createSection, deleteSection,
  getTimetable, createTimetable, updateTimetableSlot, deleteTimetable,
  getAttendance, markAttendance,
  getSubmissions, createSubmission, updateSubmission 
} from '../controllers/academicController.js';

import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Tests
router.get('/tests', getTests);
router.post('/tests', createTest);
router.delete('/tests/:id', deleteTest);

// Assignments
const assignmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Need to make sure directory exists in production, but handled by seed/mkdir
    cb(null, 'uploads/assignments/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const assignmentUpload = multer({ 
  storage: assignmentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.get('/assignments', getAssignments);
router.post('/assignments', assignmentUpload.single('pdfFile'), createAssignment);
router.delete('/assignments/:id', deleteAssignment);

// Subjects
router.get('/subjects', getSubjects);
router.get('/subjects/faculty', getMySubjects);
router.post('/subjects', createSubject);
router.delete('/subjects/:id', deleteSubject);

// Sections
router.get('/sections', getSections);
router.get('/my-sections', getMySections);
router.post('/sections', createSection);
router.delete('/sections/:id', deleteSection);

// Timetable
import { getFacultyTimetable, getStudentTimetable } from '../controllers/academicController.js';

router.get('/timetable/faculty', getFacultyTimetable);
router.get('/timetable/student', getStudentTimetable);
router.get('/timetable', getTimetable);
router.post('/timetable', createTimetable);
router.put('/timetable/:id', updateTimetableSlot);
router.delete('/timetable/:id', deleteTimetable);

// Attendance
router.get('/attendance', getAttendance);
router.post('/attendance/mark', markAttendance);

// Submissions


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/submissions/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only PDF and image files are allowed'));
  }
};

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});
router.get('/submissions', getSubmissions);

router.post('/submissions', (req, res, next) => {
  upload.single('file')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: 'Upload Error: ' + err.message });
    } else if (err) {
      return res.status(500).json({ error: 'Unknown Error: ' + err.message });
    }
    createSubmission(req, res);
  });
});

router.patch('/submissions/:id', updateSubmission);

export default router;
