import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './context/ThemeContext';
import { SkeletonTable, SkeletonCard } from './components/ui/Skeleton';
import EmptyState from './components/ui/EmptyState';
import api from './utils/api';
import TimetableGrid from './components/TimetableGrid';
import { useSocket } from './context/SocketContext';
import { toast as hotToast } from 'react-hot-toast';
import SubmissionModal from './components/SubmissionModal';

export default function StudentDashboard() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-home' },
        { id: 'attendance', label: 'My Attendance', icon: 'fa-calendar-check' },
        { id: 'timetable', label: 'Class Schedule', icon: 'fa-clock' },
        { id: 'tests', label: 'My Tests', icon: 'fa-tasks' },
        { id: 'assignments', label: 'Assignments', icon: 'fa-file-alt' },
        { id: 'records', label: 'My Records', icon: 'fa-history' },
        { id: 'notices', label: 'Notice Board', icon: 'fa-bullhorn' }
    ];
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
            {/* Sidebar (Desktop) */}
            <aside className={`hidden md:flex flex-col fixed h-screen z-50 transition-all duration-300 ease-in-out bg-gradient-to-b from-blue-900 via-indigo-900 to-slate-900 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:border-r border-slate-800 text-white shadow-2xl ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
                <div className="p-6 border-b border-slate-700/50 flex justify-between items-center h-20">
                    {!isSidebarCollapsed && (
                        <div>
                            <h2 className="text-xl font-bold tracking-tight truncate">JIS UNIVERSITY</h2>
                            <p className="text-xs text-blue-300 dark:text-slate-400 mt-1 uppercase font-semibold">Student Portal</p>
                        </div>
                    )}
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white outline-none flex-shrink-0">
                        <i className={`fas ${isSidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
                    </button>
                </div>
                <nav className="flex-1 py-6 overflow-y-auto space-y-1 overflow-x-hidden">
                    {tabs.map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id)} 
                            className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-200 border-l-4 group ${activeTab === tab.id ? 'bg-blue-800/50 dark:bg-blue-900/40 border-blue-500' : 'border-transparent hover:bg-white/5 hover:border-blue-400/30'}`}
                            title={isSidebarCollapsed ? tab.label : ''}
                        >
                            <i className={`fas ${tab.icon} w-5 text-center text-lg ${activeTab === tab.id ? 'text-blue-400' : 'text-slate-400'}`}></i>
                            {!isSidebarCollapsed && <span className={`font-medium whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-slate-300'}`}>{tab.label}</span>}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-700/50">
                    <button onClick={handleLogout} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl hover:bg-red-500/10 text-slate-300 hover:text-red-400 transition-colors group`}>
                        <i className="fas fa-sign-out-alt text-lg group-hover:-translate-x-1 transition-transform"></i>
                        {!isSidebarCollapsed && <span className="font-medium whitespace-nowrap">Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 flex overflow-x-auto overflow-y-hidden text-center pb-safe">
                {tabs.map(tab => (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`min-w-[80px] h-16 flex-1 flex flex-col justify-center items-center gap-1 transition-colors px-2 border-t-2 ${activeTab === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10' : 'border-transparent text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
                     >
                        <i className={`fas ${tab.icon} text-lg`}></i>
                        <span className="text-[10px] font-bold tracking-tight whitespace-nowrap truncate w-full max-w-[80px]">{tab.label}</span>
                     </button>
                ))}
            </nav>

            {/* Main Content */}
            <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out pb-16 md:pb-0 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-72'} ml-0`}>
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
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Overview</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                        <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl shadow-xl shadow-blue-500/20 text-white relative overflow-hidden flex items-center justify-between">
                                            <div className="absolute -right-10 -bottom-10 opacity-10">
                                                <i className="fas fa-calendar-check text-9xl"></i>
                                            </div>
                                            <div className="relative z-10">
                                                <h3 className="text-lg font-medium text-blue-100 mb-1">Current Attendance</h3>
                                                <div className="text-5xl font-black">{calculateAttendance()}%</div>
                                            </div>
                                            <div className={`relative z-10 w-20 h-20 rounded-full border-4 flex items-center justify-center text-3xl ${parseFloat(calculateAttendance()) > 75 ? 'border-emerald-400 text-emerald-400' : 'border-amber-400 text-amber-400'}`}>
                                                <i className={`fas ${parseFloat(calculateAttendance()) > 75 ? 'fa-smile' : 'fa-exclamation-triangle'}`}></i>
                                            </div>
                                        </motion.div>

                                        <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/50 flex flex-col justify-center">
                                            <h3 className="text-gray-500 dark:text-slate-400 font-bold uppercase text-xs tracking-wider mb-4">Academic Workload</h3>
                                            <div className="flex gap-4">
                                                <div className="flex-1 bg-purple-50 dark:bg-purple-900/10 rounded-2xl p-4 border border-purple-100 dark:border-purple-800/30">
                                                    <div className="text-purple-600 dark:text-purple-400 text-xl mb-2"><i className="fas fa-tasks"></i></div>
                                                    <div className="text-3xl font-black text-gray-900 dark:text-white">{tests.length}</div>
                                                    <div className="text-xs text-gray-500 dark:text-slate-400 font-bold mt-1">Pending Tests</div>
                                                </div>
                                                <div className="flex-1 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-800/30">
                                                    <div className="text-indigo-600 dark:text-indigo-400 text-xl mb-2"><i className="fas fa-file-alt"></i></div>
                                                    <div className="text-3xl font-black text-gray-900 dark:text-white">{assignments.length}</div>
                                                    <div className="text-xs text-gray-500 dark:text-slate-400 font-bold mt-1">Pending Assignments</div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>

                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Upcoming Deadlines</h2>
                                    {isLoading ? (
                                        <SkeletonTable columns={2} rows={3} />
                                    ) : [...tests, ...assignments].length === 0 ? (
                                        <EmptyState title="All Caught Up!" message="You have no upcoming tests or assignments." icon="fa-check-circle" />
                                    ) : (
                                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-6 md:p-12 pl-12 md:pl-0">
                                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-transparent before:via-blue-200 dark:before:via-slate-700 before:to-transparent">
                                                {[...tests, ...assignments].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0,4).map((item) => (
                                                    <div key={item._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                        <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white dark:border-slate-900 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                                            <i className={`fas ${item.duration ? 'fa-tasks' : 'fa-file-alt'} text-sm`}></i>
                                                        </div>
                                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-5 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-shadow">
                                                            <div className="flex flex-col">
                                                                <span className={`text-[10px] font-black uppercase tracking-wider mb-1 ${item.duration ? 'text-purple-500' : 'text-indigo-500'}`}>{item.duration ? 'Test' : 'Assignment'}</span>
                                                                <h4 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{item.title}</h4>
                                                                <div className="flex items-center gap-3 mt-3">
                                                                    <div className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold">Due: {new Date(item.dueDate).toLocaleDateString()}</div>
                                                                    <div className="text-xs font-bold text-gray-500 dark:text-slate-400"><i className="fas fa-star mr-1 text-yellow-400"></i> {item.marks} marks</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
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

                                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 overflow-x-auto overflow-y-hidden">
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
                                <TimetableGrid roleAttr="student" isEditable={false} />
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
                                                        {rec.filePath && (
                                                            <a 
                                                                href={`http://localhost:5001/${rec.filePath}`} 
                                                                target="_blank" 
                                                                rel="noreferrer" 
                                                                download 
                                                                title="Download Attached Work"
                                                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold text-sm bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                                                            >
                                                                <i className="fas fa-download"></i> View File
                                                            </a>
                                                        )}
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
            <SubmissionModal 
                isOpen={interactionModal.show && interactionModal.type === 'assignment'} 
                onClose={() => setInteractionModal({ show: false, type: '', data: null })} 
                assignment={interactionModal.data || {}} 
                onSuccess={() => {
                    setInteractionModal({ show: false, type: '', data: null });
                    showToast('Successfully submitted!');
                    refreshData(user.id);
                }} 
            />

            <AnimatePresence>
                {interactionModal.show && interactionModal.type === 'test' && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                         <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl border border-gray-100 dark:border-slate-700"
                        >
                            <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                <i className="fas fa-hourglass-half text-3xl"></i>
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">{interactionModal.data.title}</h3>
                            <p className="text-gray-500 dark:text-slate-400 mb-8 font-medium">Get ready. The timer will start as soon as you begin.</p>
                            <div className="flex gap-4">
                                <button onClick={() => setInteractionModal({ show: false, type: '', data: null })} className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                                <button onClick={executeInteraction} className="flex-1 text-white py-3 rounded-xl font-bold shadow-lg transition-all bg-purple-600 hover:bg-purple-700 shadow-purple-200 dark:shadow-none">
                                    Start Test
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
