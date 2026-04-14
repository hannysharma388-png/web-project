import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './context/ThemeContext';
import { SkeletonTable, SkeletonCard } from './components/ui/Skeleton';
import EmptyState from './components/ui/EmptyState';
import api from './utils/api';
import { useSocket } from './context/SocketContext';
import { toast as hotToast } from 'react-hot-toast';

export default function StudentDashboard() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [tests, setTests] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [notices, setNotices] = useState([]);
    const [myRecords, setMyRecords] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [timetable, setTimetable] = useState([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [interactionModal, setInteractionModal] = useState({ show: false, type: '', data: null });
    const [toast, setToast] = useState('');

    const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'student') {
            navigate('/');
            return;
        }
        setUser(parsedUser);
        refreshData(parsedUser.id);
    }, [navigate]);

    const socket = useSocket();

    useEffect(() => {
        if (socket && user) {
            const handleNewAssignment = (assignment) => {
                hotToast.success(`New Assignment Created: ${assignment.title}`);
                refreshData(user.id);
            };

            socket.on('new_assignment', handleNewAssignment);

            return () => {
                socket.off('new_assignment', handleNewAssignment);
            };
        }
    }, [socket, user]);

    const refreshData = async (studentId) => {
        if (!studentId) return;
        setIsLoading(true);
        try {
            const testRes = await api.get('/academic/tests');
            setTests(Array.isArray(testRes.data) ? testRes.data : []);

            const assignRes = await api.get('/academic/assignments');
            setAssignments(Array.isArray(assignRes.data) ? assignRes.data : []);

            const notRes = await api.get('/notices');
            setNotices(Array.isArray(notRes.data) ? notRes.data : []);

            const recRes = await api.get(`/academic/submissions?studentId=${studentId}`);
            setMyRecords(Array.isArray(recRes.data) ? recRes.data : []);

            const attRes = await api.get(`/academic/attendance?studentId=${studentId}`);
            setAttendance(Array.isArray(attRes.data) ? attRes.data : []);

            const ttRes = await api.get('/academic/timetable');
            setTimetable(Array.isArray(ttRes.data) ? ttRes.data : []);
        } catch (err) {
            console.error('API Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateAttendance = () => {
        if (!attendance || attendance.length === 0) return 0;
        const present = attendance.filter(a => a.status === 'present').length;
        return ((present / attendance.length) * 100).toFixed(1);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const executeInteraction = async () => {
        const payload = {
            studentId: user.id,
            [interactionModal.type === 'test' ? 'testId' : 'assignmentId']: interactionModal.data._id
        };

        try {
            await api.post('/academic/submissions', payload);
            showToast(`Successfully submitted!`);
            refreshData(user.id);
        } catch (err) {
            showToast('Submission failed');
        }
        setInteractionModal({ show: false, type: '', data: null });
    };

    if (!user) return null;

    return (
        <div className="bg-gray-50 dark:bg-slate-950 font-inter min-h-screen flex transition-colors duration-300">
            {/* Sidebar */}
            <aside className="w-72 bg-gradient-to-b from-blue-900 via-indigo-900 to-slate-900 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:border-r border-slate-800 text-white fixed h-screen flex flex-col shadow-2xl z-50 transition-colors duration-300">
                <div className="p-6 border-b border-slate-700/50">
                    <h2 className="text-xl font-bold tracking-tight">JIS UNIVERSITY</h2>
                    <p className="text-xs text-blue-300 dark:text-slate-400 mt-1 uppercase font-semibold">Student Portal</p>
                </div>
                <nav className="flex-1 py-6 overflow-y-auto space-y-1">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: 'fa-home' },
                        { id: 'attendance', label: 'My Attendance', icon: 'fa-calendar-check' },
                        { id: 'timetable', label: 'Class Schedule', icon: 'fa-clock' },
                        { id: 'tests', label: 'My Tests', icon: 'fa-tasks' },
                        { id: 'assignments', label: 'Assignments', icon: 'fa-file-alt' },
                        { id: 'records', label: 'My Records', icon: 'fa-history' },
                        { id: 'notices', label: 'Notice Board', icon: 'fa-bullhorn' }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id)} 
                            className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-200 border-l-4 ${activeTab === tab.id ? 'bg-blue-800/50 dark:bg-blue-900/40 border-blue-500' : 'border-transparent hover:bg-white/5 hover:border-blue-400/30'}`}
                        >
                            <i className={`fas ${tab.icon} w-5 text-center ${activeTab === tab.id ? 'text-blue-400' : 'text-slate-400'}`}></i>
                            <span className={`font-medium ${activeTab === tab.id ? 'text-white' : 'text-slate-300'}`}>{tab.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-6 border-t border-slate-700/50">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-slate-300 hover:text-red-400 transition-colors group">
                        <i className="fas fa-sign-out-alt group-hover:-translate-x-1 transition-transform"></i>
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-72 flex flex-col min-h-screen">
                <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-8 py-4 flex justify-between items-center sticky top-0 z-40 transition-colors duration-300 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white capitalize">{activeTab.replace('-', ' ')}</h1>
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={toggleTheme} 
                            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-yellow-400 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                        </button>
                        <div className="flex items-center gap-3 pr-4 border-r border-gray-200 dark:border-slate-700">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-gray-800 dark:text-white">{user.name}</p>
                                <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">{user.roleAttr}</p>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
                                {user.name.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8 flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Dashboard Tab */}
                            {activeTab === 'dashboard' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {isLoading ? (
                                        Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)
                                    ) : (
                                        <>
                                            <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 flex flex-col items-center">
                                                <div className="w-16 h-16 rounded-full border-4 border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center mb-4 relative">
                                                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{calculateAttendance()}%</span>
                                                </div>
                                                <h3 className="text-gray-800 dark:text-white font-bold text-lg">Attendance</h3>
                                            </motion.div>
                                            <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 text-center">
                                                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4 border border-purple-100 dark:border-purple-800"><i className="fas fa-tasks"></i></div>
                                                <h3 className="text-3xl font-black text-gray-800 dark:text-white">{tests.length}</h3>
                                                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1">Pending Tests</p>
                                            </motion.div>
                                            <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 text-center">
                                                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4 border border-indigo-100 dark:border-indigo-800"><i className="fas fa-file-alt"></i></div>
                                                <h3 className="text-3xl font-black text-gray-800 dark:text-white">{assignments.length}</h3>
                                                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1">Pending Assignments</p>
                                            </motion.div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Attendance Tab */}
                            {activeTab === 'attendance' && (
                                <div className="space-y-6 max-w-5xl mx-auto">
                                    {isLoading ? (
                                        <SkeletonTable columns={3} rows={5} />
                                    ) : attendance.length === 0 ? (
                                        <EmptyState title="No Attendance Data" message="Your attendance records haven't been processed yet." icon="fa-calendar-times" />
                                    ) : (
                                        <>
                                            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 flex items-center justify-between">
                                                <div>
                                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Attendance Summary</h2>
                                                    <p className="text-gray-500 dark:text-slate-400 mt-2">Total Classes Tracked: <span className="font-bold text-gray-800 dark:text-white">{attendance.length}</span></p>
                                                </div>
                                                <div className={`w-24 h-24 rounded-full border-8 flex items-center justify-center text-2xl font-black ${parseFloat(calculateAttendance()) > 75 ? 'border-emerald-500 dark:border-emerald-600 text-emerald-600 dark:text-emerald-400' : 'border-amber-500 dark:border-amber-600 text-amber-600 dark:text-amber-400'}`}>
                                                    {calculateAttendance()}%
                                                </div>
                                            </div>

                                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 overflow-hidden">
                                                <table className="w-full text-left">
                                                    <thead className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700/50">
                                                        <tr>
                                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Class</th>
                                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                                        {attendance.map(a => (
                                                            <tr key={a._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{new Date(a.date).toLocaleDateString()}</td>
                                                                <td className="px-6 py-4 text-sm font-medium text-gray-600 dark:text-slate-300">{a.classId?.name || 'Class'}</td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${a.status === 'present' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : a.status === 'absent' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                                                                        {a.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Timetable Tab */}
                            {activeTab === 'timetable' && (
                                isLoading ? (
                                    <SkeletonTable columns={4} rows={5} />
                                ) : timetable.length === 0 ? (
                                    <EmptyState title="No Timetable" message="Your class schedule is not available right now." icon="fa-clock" />
                                ) : (
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700/50">
                                                <tr>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Day</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Period 1</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Period 2</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Period 3</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Period 4</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                                                    <tr key={day} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-gray-700 dark:text-white">{day}</td>
                                                        {[1, 2, 3, 4].map(period => {
                                                            const slot = timetable.find(t => t.day === day && t.period === period);
                                                            return (
                                                                <td key={period} className="px-6 py-4">
                                                                    {slot ? (
                                                                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 p-4 rounded-xl">
                                                                            <p className="text-sm font-bold text-blue-700 dark:text-blue-400 truncate">{slot.subject}</p>
                                                                            <p className="text-[10px] text-blue-500 dark:text-blue-300 mt-1 uppercase font-bold tracking-wider">{slot.teacherId?.name || 'TBA'}</p>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-gray-300 dark:text-slate-600 text-sm font-medium">---</span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            )}

                            {/* Tests Tab */}
                            {activeTab === 'tests' && (
                                isLoading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}
                                    </div>
                                ) : tests.length === 0 ? (
                                    <EmptyState title="No Tests Scheduled" message="You have no upcoming tests right now. Enjoy your free time!" icon="fa-hourglass-start" />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {tests.map(t => (
                                            <motion.div whileHover={{ y: -5 }} key={t._id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700/50 flex flex-col justify-between">
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t.title}</h3>
                                                    <div className="flex gap-2 mt-4 items-center">
                                                        <span className="px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs font-bold">Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="mt-4 flex gap-4">
                                                        <p className="text-gray-500 dark:text-slate-400 text-sm font-medium"><i className="fas fa-clock mr-1"></i> {t.duration} mins</p>
                                                        <p className="text-gray-500 dark:text-slate-400 text-sm font-medium"><i className="fas fa-star mr-1"></i> {t.marks} marks</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setInteractionModal({ show: true, type: 'test', data: t })} className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-200 dark:shadow-none transition-all">Take Test</button>
                                            </motion.div>
                                        ))}
                                    </div>
                                )
                            )}

                            {/* Assignments Tab */}
                            {activeTab === 'assignments' && (
                                isLoading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}
                                    </div>
                                ) : assignments.length === 0 ? (
                                    <EmptyState title="No Pending Assignments" message="You've caught up with all your homework!" icon="fa-file-alt" />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {assignments.map(a => (
                                            <motion.div whileHover={{ y: -5 }} key={a._id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700/50 flex flex-col justify-between">
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{a.title}</h3>
                                                    <div className="flex gap-2 mt-4 items-center">
                                                        <span className="px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs font-bold">Due: {new Date(a.dueDate).toLocaleDateString()}</span>
                                                        <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded text-xs font-bold">{a.marks} Marks</span>
                                                    </div>
                                                </div>
                                                <button onClick={() => setInteractionModal({ show: true, type: 'assignment', data: a })} className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all">Submit Work</button>
                                            </motion.div>
                                        ))}
                                    </div>
                                )
                            )}

                            {/* Records Tab */}
                            {activeTab === 'records' && (
                                isLoading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}
                                    </div>
                                ) : myRecords.length === 0 ? (
                                    <EmptyState title="No Academic Records" message="You don't have any graded submissions yet. Submit assignments to begin tracking your performance." icon="fa-history" />
                                ) : (
                                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-slate-700/50 pb-4">Academic Performance History</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {myRecords.map(rec => (
                                                <motion.div whileHover={{ y: -5 }} key={rec._id} className="bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 p-6 rounded-2xl hover:shadow-lg transition-all group overflow-hidden relative">
                                                    <div className={`absolute top-0 right-0 w-2 h-full ${rec.grade !== undefined ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                                    <div className="flex justify-between items-start mb-4 border-b border-gray-200 dark:border-slate-700 pb-4">
                                                        <span className={`text-[10px] px-3 py-1 rounded-lg font-bold uppercase tracking-wider ${rec.assignmentId ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'}`}>
                                                            {rec.assignmentId ? 'Assignment' : 'Test'}
                                                        </span>
                                                        <span className="text-xs text-gray-400 dark:text-slate-500 font-bold">{new Date(rec.submittedAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{rec.assignmentId?.title || rec.testId?.title}</h4>
                                                    
                                                    <div className="mt-6 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-black tracking-widest mb-1">Score</p>
                                                            {rec.grade !== undefined ? (
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{rec.grade}</span>
                                                                    <span className="text-sm font-bold text-gray-400 dark:text-slate-500">/ {rec.assignmentId?.marks || rec.testId?.marks || 100}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm font-bold text-amber-500 dark:text-amber-400 italic">Processing</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {rec.feedback && (
                                                        <div className="mt-6 p-4 bg-white dark:bg-slate-800 border-l-4 border-indigo-500 dark:border-indigo-400 rounded-r-xl shadow-sm">
                                                            <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-black uppercase mb-1">Feedback</p>
                                                            <p className="text-xs text-gray-600 dark:text-slate-400 italic font-medium leading-relaxed">"{rec.feedback}"</p>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            )}

                            {/* Notices Tab */}
                            {activeTab === 'notices' && (
                                isLoading ? (
                                    <div className="grid gap-6">
                                        {Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}
                                    </div>
                                ) : notices.length === 0 ? (
                                    <EmptyState title="No Notices" message="There are currently no announcements." icon="fa-bullhorn" />
                                ) : (
                                    <div className="grid gap-6">
                                        {notices.map(n => (
                                            <motion.div whileHover={{ y: -2 }} key={n._id} className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-2xl border border-orange-100 dark:border-orange-800/30 shadow-sm relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500"></div>
                                                <h4 className="text-xl font-bold text-orange-900 dark:text-orange-400 mb-2">{n.title}</h4>
                                                <p className="text-gray-700 dark:text-slate-300 leading-relaxed font-medium">{n.content}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                )
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Modals Simulation */}
            <AnimatePresence>
                {interactionModal.show && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                         <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl border border-gray-100 dark:border-slate-700"
                        >
                            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${interactionModal.type === 'test' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>
                                <i className={`fas ${interactionModal.type === 'test' ? 'fa-hourglass-half' : 'fa-cloud-upload-alt'} text-3xl`}></i>
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">{interactionModal.data.title}</h3>
                            <p className="text-gray-500 dark:text-slate-400 mb-8 font-medium">{interactionModal.type === 'test' ? 'Get ready. The timer will start as soon as you begin.' : 'Securely upload your completed work here.'}</p>
                            <div className="flex gap-4">
                                <button onClick={() => setInteractionModal({ show: false, type: '', data: null })} className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                                <button onClick={executeInteraction} className={`flex-1 text-white py-3 rounded-xl font-bold shadow-lg transition-all ${interactionModal.type === 'test' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200 dark:shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'}`}>
                                    {interactionModal.type === 'test' ? 'Start Test' : 'Upload File'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.9 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-6 right-6 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 p-4 z-50 flex items-center gap-4"
                    >
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <i className="fas fa-check text-emerald-500"></i>
                        </div>
                        <p className="font-bold text-gray-800 dark:text-white">{toast}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
