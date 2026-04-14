// server/controllers/reportsController.js
import mongoose from 'mongoose';
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

// Attendance Trends
export const getAttendanceTrends = async (req, res) => {
  try {
    const { classId, startDate, endDate } = req.query;
    let match = {};
    if (classId) match.classId = classId;
    if (startDate && endDate) {
      match.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }

    const attendance = await Attendance.aggregate([
      { $match: { ...match, classId: match.classId ? new mongoose.Types.ObjectId(match.classId) : { $exists: true } } },
      {
        $group: {
          _id: { 
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const formattedData = attendance.map(item => {
      const dataPoint = { date: item._id, present: 0, absent: 0, late: 0 };
      item.statuses.forEach(s => {
        dataPoint[s.status] = s.count;
      });
      return dataPoint;
    });

    res.json(formattedData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Performance Metrics
export const getPerformanceMetrics = async (req, res) => {
  try {
    const { authorId } = req.query; // faculty id
    let match = {};

    // Populating sub to calculate metrics. Since we might need all for admin, authorId is optional.
    const subs = await Submission.find(match)
      .populate('assignmentId', 'title marks authorId')
      .populate('testId', 'title marks authorId')
      .lean();

    const stats = {};
    subs.forEach(s => {
      const parent = s.assignmentId || s.testId;
      if (!parent || typeof s.grade !== 'number') return;
      
      // If filtering by authorId, skip if it doesn't match
      if (authorId && parent.authorId && parent.authorId.toString() !== authorId) return;

      const id = parent._id.toString();
      if (!stats[id]) {
        stats[id] = {
          name: parent.title,
          totalScore: 0,
          maxMarks: parent.marks,
          count: 0
        };
      }
      stats[id].totalScore += s.grade;
      stats[id].count += 1;
    });

    const performanceData = Object.values(stats).map(s => ({
      name: s.name,
      averageScore: parseFloat((s.totalScore / s.count).toFixed(2)),
      maxMarks: s.maxMarks,
      averagePercentage: s.maxMarks > 0 ? parseFloat(((s.totalScore / s.count) / s.maxMarks * 100).toFixed(2)) : 0
    }));

    res.json(performanceData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
