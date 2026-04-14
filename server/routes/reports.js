import express from 'express';
import { 
  getAttendanceSummary, 
  getStudentGrades, 
  getCourseReport 
} from '../controllers/reportsController.js';

import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/attendance-summary', getAttendanceSummary);
router.get('/student-grades', getStudentGrades);
router.get('/course-report', getCourseReport);

export default router;
