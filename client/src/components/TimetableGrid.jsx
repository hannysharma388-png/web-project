import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const TimetableGrid = ({ fetchUrl = '/academic/timetable', isEditable = false, onRefresh }) => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '08:15', '09:15', '10:15', '11:15', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  useEffect(() => {
    fetchData();
  }, [fetchUrl]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(fetchUrl);
      setTimetable(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Timetable Fetch Error:', err);
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (start, end) => {
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    const mins = (eH * 60 + eM) - (sH * 60 + sM);
    return (mins / 60).toFixed(1);
  };

  const getSlotPosition = (time) => {
    const [h, m] = time.split(':').map(Number);
    const totalMins = h * 60 + m;
    const startMins = 8 * 60 + 15; // Start at 8:15
    const slotWidth = 60; // 60 mins per main column
    return ((totalMins - startMins) / slotWidth) + 1;
  };

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
    <div className="w-full bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[1000px] p-8">
          {/* Header Time Indicators */}
          <div className="grid grid-cols-[120px_repeat(10,1fr)] gap-4 mb-6 sticky top-0 bg-white dark:bg-slate-900 z-10 py-2">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">Day / Time</div>
            {timeSlots.map(time => (
              <div key={time} className="text-[10px] font-bold text-slate-400 text-center uppercase border-l border-slate-100 dark:border-slate-800 pt-1">
                {time}
              </div>
            ))}
          </div>

          {/* Grid Rows */}
          <div className="space-y-4">
            {days.map(day => (
              <div key={day} className="grid grid-cols-[120px_repeat(10,1fr)] gap-4 items-stretch group min-h-[120px] border-b border-gray-50 dark:border-slate-800/50 pb-4 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                {/* Day Label */}
                <div className="flex flex-col justify-center">
                  <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">{day}</span>
                  <div className="w-6 h-1 bg-indigo-500 rounded-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>

                {/* Slots Container (Overlayed on row) */}
                <div className="col-span-10 relative h-full">
                  {timetable
                    .filter(slot => slot.day === day)
                    .map(slot => {
                      const startCol = getSlotPosition(slot.startTime);
                      const endCol = getSlotPosition(slot.endTime);
                      const duration = calculateDuration(slot.startTime, slot.endTime);
                      const isLab = slot.sessionType === 'Lab' || slot.sessionType === 'Workshop';

                      // Live check
                      const now = new Date();
                      const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
                      const currentTimeMins = now.getHours() * 60 + now.getMinutes();
                      const [sH, sM] = slot.startTime.split(':').map(Number);
                      const [eH, eM] = slot.endTime.split(':').map(Number);
                      const isCurrentlyLive = currentDay === slot.day && currentTimeMins >= (sH * 60 + sM) && currentTimeMins < (eH * 60 + eM);

                      return (
                        <div
                          key={slot._id}
                          className={`absolute inset-y-0 p-3 rounded-2xl transition-all hover:scale-[1.02] hover:shadow-xl z-20 group/card cursor-pointer flex flex-col justify-between border-l-4 ${
                            isCurrentlyLive 
                              ? 'ring-4 ring-indigo-500/30 shadow-2xl z-30' 
                              : ''
                          } ${
                            isLab 
                              ? 'bg-blue-500 text-white border-blue-700 shadow-blue-100' 
                              : 'bg-teal-500 text-white border-teal-700 shadow-teal-100'
                          }`}
                          style={{
                            left: `${((startCol - 1) / 10) * 100}%`,
                            width: `${((endCol - startCol) / 10) * 100}%`,
                            marginLeft: '2px',
                            marginRight: '2px'
                          }}
                        >
                          <div className="flex flex-col gap-0.5 overflow-hidden">
                            <div className="flex justify-between items-start">
                              <span className="text-[9px] font-black opacity-80 whitespace-nowrap flex items-center gap-1">
                                {isCurrentlyLive && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>}
                                {slot.startTime} - {slot.endTime}
                              </span>
                              {isEditable && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDelete(slot._id); }}
                                  className="text-white/0 group-hover/card:text-white/100 hover:text-red-200 transition-all text-xs"
                                >
                                  <i className="fas fa-trash-alt"></i>
                                </button>
                              )}
                            </div>
                            <span className="text-[9px] font-bold opacity-70 italic">{duration} hours</span>
                            <h5 className="font-bold text-[11px] leading-tight mt-1 line-clamp-2">
                              {slot.subject?.code} - {slot.subject?.name}
                            </h5>
                          </div>

                          <div className="mt-2 space-y-0.5 border-t border-white/20 pt-1.5">
                            <div className="flex items-center gap-1.5">
                              <i className="fas fa-chalkboard text-[8px] opacity-70"></i>
                              <span className="text-[10px] font-bold">{slot.sessionType || 'Lecture'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <i className="fas fa-map-marker-alt text-[8px] opacity-70"></i>
                              <span className="text-[10px] font-medium truncate">{slot.room || 'TBA'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-white opacity-80"></div>
                              <span className="text-[9px] font-black tracking-wider uppercase truncate">{slot.faculty?.name}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableGrid;
