import React, { useState, useEffect } from 'react';

const AttendanceTable = ({ students, studentId, date, subjectId, sectionId, onMarkAttendance, role, loading }) => {
  const [attendanceData, setAttendanceData] = useState([]);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        if (date && subjectId) {
          const api = await import('../utils/api');
          const res = await api.default.get(`/academic/attendance?date=${date}&subjectId=${subjectId}${sectionId ? `&sectionId=${sectionId}` : ''}${studentId ? `&studentId=${studentId}` : ''}`);
          
          const attMap = new Map(res.data.map(a => {
            const sId = a.student?._id || a.student;
            return [sId, a.status];
          }));

          if (role === 'student' && studentId) {
            setAttendanceData([{ _id: studentId, status: attMap.get(studentId) || 'absent' }]);
          } else if (students) {
            setAttendanceData(students.map(s => ({ ...s, status: attMap.get(s._id) || 'absent' })));
          }
        } else {
          const defaultList = students ? students.map(s => ({ ...s, status: 'absent' })) : [];
          setAttendanceData(defaultList);
        }
      } catch (err) {
        console.error(err);
        const defaultList = students ? students.map(s => ({ ...s, status: 'absent' })) : [];
        setAttendanceData(defaultList);
      }
    };
    fetchAttendance();
  }, [students, studentId, date, subjectId, sectionId, role]);

  const handleStatusChange = (sId, status) => {
    setAttendanceData(prev => prev.map(s => s._id === sId ? { ...s, status } : s));
  };

  const submitAttendance = () => {
    onMarkAttendance({ 
        date, 
        subject: subjectId, 
        section: sectionId, 
        attendances: attendanceData.map(s => ({ studentId: s._id, status: s.status })) 
    });
  };

  const markAll = (status) => {
    setAttendanceData(prev => prev.map(s => ({ ...s, status })));
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-slate-900/50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Name/ID</th>
            {role !== 'student' && <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Email</th>}
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
            {role !== 'student' && <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Action</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
          {attendanceData.map(student => (
            <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900 dark:text-white">{student.name || 'Your Record'}</div>
                {student.id && <div className="text-xs text-gray-500">{student.id}</div>}
              </td>
              {role !== 'student' && <td className="px-6 py-4 text-sm text-gray-900 dark:text-slate-300">{student.email}</td>}
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  student.status === 'present' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  student.status === 'late' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                }`}>
                  {student.status}
                </span>
              </td>
              {role !== 'student' && (
                <td className="px-6 py-4">
                  <select 
                    value={student.status} 
                    onChange={(e) => handleStatusChange(student._id, e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="absent">Absent</option>
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                  </select>
                </td>
              )}
            </tr>
          ))}
          {attendanceData.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                <i className="fas fa-user-slash text-2xl mb-2 block opacity-20"></i>
                No records found for this selection
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {role !== 'student' && attendanceData.length > 0 && (
        <div className="p-6 bg-gray-50 dark:bg-slate-900/30 border-t border-gray-100 dark:border-slate-700 flex flex-wrap gap-4 justify-between items-center">
          <div className="flex gap-3">
            <button 
              onClick={() => markAll('present')}
              className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg font-semibold hover:bg-emerald-200 transition-colors"
            >
              Mark All Present
            </button>
            <button 
              onClick={() => markAll('absent')}
              className="bg-rose-100 text-rose-700 px-4 py-2 rounded-lg font-semibold hover:bg-rose-200 transition-colors"
            >
              Mark All Absent
            </button>
          </div>
          <button 
            onClick={submitAttendance}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
          >
            Save Attendance
          </button>
        </div>
      )}
    </div>
  );
};

export default AttendanceTable;
