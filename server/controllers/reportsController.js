// server/controllers/reportsController.js
import Attendance from '../models/Attendance.js';
import Submission from '../models/Submission.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

// Attendance Summary by class and date range
export const getAttendanceSummary = async (req, res) => {
  try {
    const { classId, startDate, endDate } = req.query;
    const match = { classId };
    if (startDate && endDate) {
      match.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }
    const attendance = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: { 
            studentId: '$studentId', 
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
          },
          status: { $last: '$status' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$count' }
        }
      }
    ]);
    const totalDays = await Attendance.distinct('date', match).then(dates => dates.length);
    const summary = attendance.reduce((acc, item) => {
      acc[item._id] = item.total;
      return acc;
    }, { totalDays });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Student Grades Report
export const getStudentGrades = async (req, res) => {
  try {
    const { studentId } = req.query;
    const subs = await Submission.find({ studentId })
      .populate('assignmentId', 'title marks')
      .lean();
    const totalMarks = subs.reduce((sum, s) => sum + (s.grade || 0), 0);
    const avgGrade = subs.length ? totalMarks / subs.length : 0;
    res.json({ submissions: subs, average: avgGrade.toFixed(2), totalMarks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Course Report
export const getCourseReport = async (req, res) => {
  try {
    const { courseId } = req.query;
    const course = await Course.findById(courseId).populate('students');
    const studentsCount = course.students.length;
    // Add more stats...
    res.json({ course: course.name, studentsCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
