import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const TimetableGrid = ({ fetchUrl = '/academic/timetable', isEditable = false, onRefresh }) => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'Long' }));

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchData();
  }, [fetchUrl]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(fetchUrl);
      console.log('Timetable Response:', res?.status, res?.data);
      
      const data = res?.data;
      setTimetable(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Timetable Fetch Error:', err);
      // No need to crash the whole app if toast fails
      if (typeof toast?.error === 'function') {
        toast.error('Failed to load timetable');
      }
    } finally {
      setLoading(false);
    }
  };

  const daySchedule = Array.isArray(timetable) ? timetable.filter(slot => slot.day === activeDay) : [];

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) return;
    try {
      await api.delete(`/academic/timetable/${id}`);
      toast.success('Slot deleted');
      fetchData();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error('Failed to delete slot');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="w-full space-y-6">
      {/* Day Selector */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 dark:bg-slate-900/50 rounded-2xl w-fit">
        {days.map(day => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeDay === day 
                ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' 
                : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Schedule List */}
      <div className="space-y-4">
        {daySchedule && daySchedule.length > 0 ? (
          daySchedule.map((slot) => {
            if (!slot) return null;
            return (
              <div 
                key={slot._id || Math.random()} 
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-colors"
              >
                <div className="flex items-center gap-5">
                  <div className="w-24 shrink-0 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-center">
                    <span className="text-sm font-black text-indigo-700 dark:text-indigo-300 block">{slot.startTime || '--:--'}</span>
                    <span className="text-[10px] uppercase font-bold text-indigo-400 dark:text-indigo-500">{slot.endTime || '--:--'}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-slate-100">{slot.subject?.name || 'Unknown Subject'}</h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <span className="text-xs text-gray-500 dark:text-slate-400">
                        <i className="far fa-user mr-1.5 opacity-70"></i>
                        {slot.faculty?.name || 'TBA'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-slate-400">
                        <i className="fas fa-users mr-1.5 opacity-70"></i>
                        {slot.section?.name || 'No Section'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {isEditable && slot._id && (
                  <button 
                    onClick={() => handleDelete(slot._id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                  >
                    <i className="far fa-trash-alt"></i>
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center bg-gray-50/50 dark:bg-slate-900/20 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-800 flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-400 mb-3">
              <i className="far fa-calendar-times text-xl"></i>
            </div>
            <p className="text-gray-500 dark:text-slate-400 font-medium">No classes scheduled for {activeDay || 'this day'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimetableGrid;
