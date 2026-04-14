import express from 'express';
import multer from 'multer';
import { 
  getTests, createTest, deleteTest,
  getAssignments, createAssignment, deleteAssignment,
  getCourses, createCourse, deleteCourse,
  getTimetable, createTimetable, deleteTimetable,
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
router.get('/assignments', getAssignments);
router.post('/assignments', createAssignment);
router.delete('/assignments/:id', deleteAssignment);

// Courses
router.get('/courses', getCourses);
router.post('/courses', createCourse);
router.delete('/courses/:id', deleteCourse);

// Timetable
router.get('/timetable', getTimetable);
router.post('/timetable', createTimetable);
router.delete('/timetable/:id', deleteTimetable);

// Attendance
router.get('/attendance', getAttendance);
router.post('/attendance/mark', markAttendance);

// Submissions
const upload = multer({ dest: 'uploads/submissions/' });
router.get('/submissions', getSubmissions);
router.post('/submissions', upload.single('file'), createSubmission);
router.patch('/submissions/:id', updateSubmission);

export default router;
