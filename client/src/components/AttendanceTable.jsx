import React, { useState, useEffect } from 'react';

const AttendanceTable = ({ students, date, classId, onMarkAttendance, role, loading }) => {
  const [attendanceData, setAttendanceData] = useState([]);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        if (date && classId) {
          const api = await import('../../utils/api');
          const res = await api.default.get(`/academic/attendance?date=${date}&classId=${classId}`);
          const attMap = new Map(res.data.map(a => [a.studentId._id, a.status]));
          setAttendanceData(students.map(s => ({ ...s, status: attMap.get(s._id) || 'absent' })));
        } else {
          setAttendanceData(students.map(s => ({ ...s, status: 'absent' })));
        }
      } catch (err) {
        console.error(err);
        setAttendanceData(students.map(s => ({ ...s, status: 'absent' })));
      }
    };
    fetchAttendance();
  }, [students, date, classId]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceData(prev => prev.map(s => s._id === studentId ? { ...s, status } : s));
  };

  const submitAttendance = () => {
    onMarkAttendance({ date, classId, attendances: attendanceData.map(s => ({ studentId: s._id, status: s.status })), markedBy: JSON.parse(localStorage.getItem('user') || '{}')._id });
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
            {role !== 'student' && <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {attendanceData.map(student => (
            <tr key={student._id} className="hover:bg-gray-50">
              <td className="px-6 py-4">{student.name}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{student.email}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  student.status === 'present' ? 'bg-green-100 text-green-800' :
                  student.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {student.status}
                </span>
              </td>
              {role !== 'student' && (
                <td className="px-6 py-4">
                  <select 
                    value={student.status} 
                    onChange={(e) => handleStatusChange(student._id, e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="absent">Absent</option>
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                  </select>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {role !== 'student' && (
        <div className="p-6 bg-gray-50 border-t">
          <button 
            onClick={submitAttendance}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700"
          >
            Mark Attendance
          </button>
        </div>
      )}
    </div>
  );
};

export default AttendanceTable;
