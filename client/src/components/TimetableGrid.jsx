import React, { useState, useEffect } from 'react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import api from '../utils/api';
import toast from 'react-hot-toast';

// Color assignment logic based on subject string
const getSubjectColor = (subject) => {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 90%)`;
};

const getSubjectBorderColor = (subject) => {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 75%)`;
};

const getTextColor = (subject) => {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 80%, 25%)`;
};

const DraggableSlot = ({ slot, isEditable }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: slot._id,
    data: slot,
    disabled: !isEditable
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 999 : 1,
    opacity: isDragging ? 0.8 : 1,
    cursor: isEditable && !isDragging ? 'grab' : isDragging ? 'grabbing' : 'default',
    backgroundColor: getSubjectColor(slot.subject),
    borderColor: getSubjectBorderColor(slot.subject),
    color: getTextColor(slot.subject)
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative w-full p-3 rounded-xl border flex flex-col items-center justify-center min-h-[5rem] shadow-sm transition-shadow ${isEditable ? 'hover:shadow-md' : ''}`}
    >
      <div className="font-bold text-center text-sm truncate w-full">{slot.subject}</div>
      <div className="text-xs font-semibold opacity-90 truncate w-full text-center mt-1">{slot.teacherId?.name || 'TBA'}</div>
      <div className="text-[10px] uppercase font-black tracking-widest mt-1 mix-blend-multiply opacity-80">{slot.room}</div>
    </div>
  );
};

const DroppableCell = ({ day, period, children, isEditable }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `${day}-${period}`,
    data: { day, period },
    disabled: !isEditable
  });

  let bgClass = 'bg-white dark:bg-slate-800';
  if (isOver && isEditable) {
    bgClass = 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-inset ring-indigo-300';
  }

  return (
    <td
      ref={setNodeRef}
      className={`p-3 border-l border-b border-gray-100 dark:border-slate-700/50 min-w-[150px] relative transition-colors ${bgClass}`}
    >
      <div className="w-full flex items-center justify-center min-h-[5rem]">
        {children || <span className="text-gray-300 dark:text-slate-600 text-sm font-medium">---</span>}
      </div>
    </td>
  );
};

const TimetableGrid = ({ roleAttr, isEditable = false }) => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = Array.from({ length: 6 }, (_, i) => i + 1);

  useEffect(() => {
    fetchData();
  }, [roleAttr]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/academic/timetable?roleAttr=${roleAttr || ''}`);
      setTimetable(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const item = active.data.current;
    const { day, period } = over.data.current;

    if (item.day === day && item.period === period) return;

    // Optimistic Update
    const originalTimetable = [...timetable];
    setTimetable(prev => prev.map(t => 
      t._id === item._id ? { ...t, day, period } : t
    ));

    try {
      await api.patch(`/academic/timetable/${item._id}`, { day, period });
      toast.success('Schedule updated!');
    } catch (err) {
      console.error(err);
      // Revert if API fails
      setTimetable(originalTimetable);
      const errorMessage = err.response?.data?.error || 'Update failed due to conflict';
      toast.error(errorMessage);
    }
  };

  const getSlot = (day, period) => {
    return timetable.find(tt => tt.day === day && tt.period === period) || null;
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 overflow-x-auto w-full">
        <table className="w-full text-left" style={{ minWidth: '900px' }}>
          <thead className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700/50">
            <tr>
              <th className="px-5 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-center w-20 border-r border-gray-100 dark:border-slate-700/50">Period</th>
              {days.map(day => (
                <th key={day} className="px-5 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-center border-l border-gray-100 dark:border-slate-700/50">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
            {periods.map(period => (
              <tr key={period} className="group">
                <td className="px-5 py-4 bg-gray-50/30 dark:bg-slate-900/30 font-bold text-gray-700 dark:text-slate-300 text-center border-r border-gray-100 dark:border-slate-700/50">{period}</td>
                {days.map(day => {
                  const slot = getSlot(day, period);
                  return (
                    <DroppableCell key={`${day}-${period}`} day={day} period={period} isEditable={isEditable}>
                      {slot && <DraggableSlot slot={slot} isEditable={isEditable} />}
                    </DroppableCell>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DndContext>
  );
};

export default TimetableGrid;
