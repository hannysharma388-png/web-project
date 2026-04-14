import React, { useState, useEffect } from 'react';

const TimetableGrid = ({ roleAttr }) => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = Array.from({ length: 6 }, (_, i) => i + 1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const api = await import('../../utils/api');
        const res = await api.default.get(`/academic/timetable?roleAttr=${roleAttr || ''}`);
        setTimetable(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchData();
  }, [roleAttr]);

  const getSlot = (day, period) => {
    return timetable.find(tt => tt.day === day && tt.period === period) || '';
  };

  if (loading) return <div className="text-center py-8">Loading Timetable...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <th className="p-4 text-left font-semibold">Period</th>
            {days.map(day => (
              <th key={day} className="p-4 font-semibold text-center">{day.slice(0,3)}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {periods.map(period => (
            <tr key={period} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium bg-gray-50">{period}</td>
              {days.map(day => {
                const slot = getSlot(day, period);
                return (
                  <td key={day} className="p-3 text-center border-l border-gray-100">
                    {slot ? (
                      <div className="space-y-1 text-sm">
                        <div className="font-semibold text-indigo-900">{slot.subject}</div>
                        <div className="text-gray-600">{slot.teacherId?.name || ''}</div>
                        <div className="text-xs bg-blue-100 px-2 py-1 rounded-full">{slot.room}</div>
                      </div>
                    ) : (
                      <div className="h-20 py-2">-</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TimetableGrid;
