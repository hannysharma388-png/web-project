import express from 'express';
import { 
  getAttendanceSummary, 
  getStudentGrades, 
  getCourseReport,
  getAttendanceTrends,
  getPerformanceMetrics
} from '../controllers/reportsController.js';

import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/attendance-summary', getAttendanceSummary);
router.get('/student-grades', getStudentGrades);
router.get('/course-report', getCourseReport);
router.get('/attendance-trends', getAttendanceTrends);
router.get('/performance-metrics', getPerformanceMetrics);

export default router;
