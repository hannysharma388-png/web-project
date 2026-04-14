import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './context/ThemeContext';
import { SkeletonTable, SkeletonCard } from './components/ui/Skeleton';
import EmptyState from './components/ui/EmptyState';
import AnalyticsView from './components/AnalyticsView';
import TimetableGrid from './components/TimetableGrid';
import api from './utils/api';
import { useSocket } from './context/SocketContext';
import { toast as hotToast } from 'react-hot-toast';

export default function FacultyDashboard() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-home' },
        { id: 'analytics', label: 'Analytics', icon: 'fa-chart-pie' },
        { id: 'students', label: 'Students', icon: 'fa-user-graduate' },
        { id: 'attendance', label: 'Attendance', icon: 'fa-calendar-check' },
        { id: 'timetable', label: 'Timetable', icon: 'fa-clock' },
        { id: 'tests', label: 'Manage Tests', icon: 'fa-tasks' },
        { id: 'assignments', label: 'Assignments', icon: 'fa-file-alt' },
        { id: 'records', label: 'Grading', icon: 'fa-check-double' },
        { id: 'notices', label: 'Notices', icon: 'fa-bullhorn' }
    ];
    const [students, setStudents] = useState([]);
    const [tests, setTests] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [notices, setNotices] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [timetable, setTimetable] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceList, setAttendanceList] = useState([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [modal, setModal] = useState({ show: false, type: '', data: null });
    const [title, setTitle] = useState('');
    const [grade, setGrade] = useState('');
    const [feedback, setFeedback] = useState('');
    const [date, setDate] = useState('');
    const [marks, setMarks] = useState(0);
    const [duration, setDuration] = useState(45);
    const [formCourseId, setFormCourseId] = useState('');
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
        if (parsedUser.role !== 'faculty') {
            navigate('/');
            return;
        }
        setUser(parsedUser);
        refreshData(parsedUser.id);
    }, [navigate]);

    const socket = useSocket();

    useEffect(() => {
        if (socket && user) {
            const handleNewSubmission = (submission) => {
                hotToast.success(`New submission received for grading!`);
                refreshData(user.id);
            };

            socket.on('new_submission', handleNewSubmission);

            return () => {
                socket.off('new_submission', handleNewSubmission);
            };
        }
    }, [socket, user]);

    const refreshData = async (userId) => {
        if (!userId) return;
        setIsLoading(true);
        try {
            const stuRes = await api.get('/users?role=student');
            setStudents(Array.isArray(stuRes.data) ? stuRes.data : []);

            const testRes = await api.get('/academic/tests');
            const allTests = testRes.data;
            setTests(Array.isArray(allTests) ? allTests.filter(t => t.authorId === userId) : []);

            const assignRes = await api.get('/academic/assignments');
            const allAssignments = assignRes.data;
            setAssignments(Array.isArray(allAssignments) ? allAssignments.filter(a => a.authorId === userId) : []);

            const notRes = await api.get('/notices');
            setNotices(Array.isArray(notRes.data) ? notRes.data : []);

            const subRes = await api.get(`/academic/submissions?facultyId=${userId}`);
            setSubmissions(Array.isArray(subRes.data) ? subRes.data : []);

            const courseRes = await api.get('/academic/courses');
            const allCourses = courseRes.data;
            setCourses(Array.isArray(allCourses) ? allCourses.filter(c => c.faculty && c.faculty.some(f => f._id === userId)) : []);

            const ttRes = await api.get('/academic/timetable');
            setTimetable(Array.isArray(ttRes.data) ? ttRes.data : []);
        } catch (err) {
            console.error('API Error:', err);
            showToast('Error syncing data');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCourseStudents = async (courseId) => {
        if (!courseId) return;
        const course = courses.find(c => c._id === courseId);
        if (course && course.students) {
            setAttendanceList(course.students.map(s => ({ studentId: s._id, name: s.name, status: 'present' })));
        }
    };

    const handleAttendanceSubmit = async () => {
        if (!selectedCourse) return showToast('Select a course first');
        try {
            await api.post('/academic/attendance/mark', {
                date: attendanceDate,
                classId: selectedCourse,
                markedBy: user.id,
                attendances: attendanceList.map(a => ({ studentId: a.studentId, status: a.status }))
            });
            showToast('Attendance marked successfully!');
        } catch (err) {
            showToast('Failed to mark attendance');
        }
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const deleteTest = async (id) => {
        try {
            await api.delete(`/academic/tests/${id}`);
            refreshData(user.id);
            showToast('Test deleted');
        } catch (err) { showToast('Delete failed'); }
    };

    const deleteAssignment = async (id) => {
        try {
            await api.delete(`/academic/assignments/${id}`);
            refreshData(user.id);
            showToast('Assignment deleted');
        } catch (err) { showToast('Delete failed'); }
    };

    const handleSubmit = async (e, type) => {
        e.preventDefault();
        if (!formCourseId) return showToast('Please select a course');
        const payload = { title, dueDate: date, marks, authorId: user.id, courseId: formCourseId };
        
        try {
            if (type === 'test') {
                payload.duration = duration;
                await api.post('/academic/tests', payload);
                showToast('Test created!');
            } else {
                await api.post('/academic/assignments', payload);
                showToast('Assignment created!');
            }
            setModal({ show: false, type: '', data: null });
            refreshData(user.id);
        } catch (err) { showToast('Execution failed'); }
    };

    const handleGradeSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/academic/submissions/${modal.data._id}`, { grade, feedback });
            showToast('Grade updated!');
            setModal({ show: false, type: '', data: null });
            refreshData(user.id);
        } catch (err) { showToast('Grade update failed'); }
    };

    if (!user) return null;

    return (
        <div className="bg-gray-50 dark:bg-slate-950 font-inter min-h-screen flex transition-colors duration-300">
            {/* Sidebar (Desktop) */}
            <aside className={`hidden md:flex flex-col fixed h-screen z-50 transition-all duration-300 ease-in-out bg-gradient-to-b from-emerald-900 via-teal-900 to-slate-900 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:border-r border-slate-800 text-white shadow-2xl ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
                <div className="p-6 border-b border-slate-700/50 flex justify-between items-center h-20">
                    {!isSidebarCollapsed && (
                        <div>
                            <h2 className="text-xl font-bold tracking-tight truncate">JIS UNIVERSITY</h2>
                            <p className="text-xs text-emerald-300 dark:text-slate-400 mt-1 uppercase font-semibold">Faculty Portal</p>
                        </div>
                    )}
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white outline-none flex-shrink-0">
                        <i className={`fas ${isSidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
                    </button>
                </div>
                <nav className="flex-1 py-6 overflow-y-auto space-y-1 overflow-x-hidden w-full">
                    {tabs.map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id)} 
                            className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-200 border-l-4 group ${activeTab === tab.id ? 'bg-emerald-800/50 dark:bg-emerald-900/40 border-emerald-500' : 'border-transparent hover:bg-white/5 hover:border-emerald-400/30'}`}
                            title={isSidebarCollapsed ? tab.label : ''}
                        >
                            <i className={`fas ${tab.icon} w-5 text-center text-lg ${activeTab === tab.id ? 'text-emerald-400' : 'text-slate-400'}`}></i>
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
                        className={`min-w-[80px] h-16 flex-1 flex flex-col justify-center items-center gap-1 transition-colors px-2 border-t-2 ${activeTab === tab.id ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-transparent text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
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
                                <p className="text-xs text-gray-500 dark:text-slate-400 lowercase">{user.email}</p>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/30">
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
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Faculty Hub</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                        <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                                <i className="fas fa-chalkboard-teacher text-8xl text-emerald-500"></i>
                                            </div>
                                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl flex items-center justify-center text-xl mb-4 relative z-10"><i className="fas fa-chalkboard-teacher"></i></div>
                                            <h3 className="text-3xl font-black text-gray-800 dark:text-white relative z-10">{courses.length}</h3>
                                            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1 relative z-10">Assigned Classes</p>
                                        </motion.div>
                                        <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                                <i className="fas fa-users text-8xl text-cyan-500"></i>
                                            </div>
                                            <div className="w-12 h-12 bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400 rounded-xl flex items-center justify-center text-xl mb-4 relative z-10"><i className="fas fa-user-graduate"></i></div>
                                            <h3 className="text-3xl font-black text-gray-800 dark:text-white relative z-10">{students.length}</h3>
                                            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1 relative z-10">Students Overlooked</p>
                                        </motion.div>
                                        <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                                <i className="fas fa-clipboard-check text-8xl text-indigo-500"></i>
                                            </div>
                                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl flex items-center justify-center text-xl mb-4 relative z-10"><i className="fas fa-clipboard-check"></i></div>
                                            <h3 className="text-3xl font-black text-gray-800 dark:text-white relative z-10">{submissions.filter(s => s.grade === undefined).length}</h3>
                                            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1 relative z-10">Pending to Grade</p>
                                        </motion.div>
                                    </div>

                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <motion.button 
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => setActiveTab('attendance')}
                                            className="p-6 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl flex items-center gap-6 text-left transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-900/30 group"
                                        >
                                            <div className="w-16 h-16 bg-emerald-600 dark:bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-emerald-200 dark:shadow-none transition-transform group-hover:scale-110">
                                                <i className="fas fa-calendar-check"></i>
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors mb-1">Mark Attendance</h4>
                                                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Record daily student presence automatically.</p>
                                            </div>
                                        </motion.button>
                                        
                                        <motion.button 
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => setActiveTab('records')}
                                            className="p-6 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl flex items-center gap-6 text-left transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-900/30 group"
                                        >
                                            <div className="w-16 h-16 bg-indigo-600 dark:bg-indigo-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-200 dark:shadow-none transition-transform group-hover:scale-110">
                                                <i className="fas fa-check-double"></i>
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors mb-1">Grade Submissions</h4>
                                                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Review and evaluate uploaded assignments rapidly.</p>
                                            </div>
                                        </motion.button>
                                    </div>
                                </div>
                            )}

                            {/* Students Tab */}
                            {activeTab === 'students' && (
                                isLoading ? (
                                    <SkeletonTable columns={3} rows={5} />
                                ) : students.length === 0 ? (
                                    <EmptyState title="No Students Found" message="Wait for admin to enroll students." icon="fa-user-graduate" />
                                ) : (
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 overflow-x-auto overflow-y-hidden">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700/50">
                                                <tr>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Course</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                                {students.map(s => (
                                                    <tr key={s._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{s.name}</td>
                                                        <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{s.email}</td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-lg text-xs font-bold">{s.roleAttr}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            )}

                            {/* Attendance Tab */}
                            {activeTab === 'attendance' && (
                                <div className="max-w-4xl mx-auto">
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 mb-6 flex flex-wrap gap-4 items-end">
                                        <div className="flex-1 min-w-[200px]">
                                            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-2">Select Course</label>
                                            <select 
                                                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all"
                                                value={selectedCourse}
                                                onChange={(e) => {
                                                    setSelectedCourse(e.target.value);
                                                    fetchCourseStudents(e.target.value);
                                                }}
                                            >
                                                <option value="">Choose a course...</option>
                                                {courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                                            </select>
                                        </div>
                                        <div className="flex-1 min-w-[200px]">
                                            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-2">Date</label>
                                            <input 
                                                type="date" 
                                                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all"
                                                value={attendanceDate}
                                                onChange={(e) => setAttendanceDate(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {selectedCourse && (
                                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 overflow-x-auto overflow-y-hidden">
                                            <table className="w-full text-left">
                                                <thead className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700/50">
                                                    <tr>
                                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Student Name</th>
                                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-center">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                                    {attendanceList.map((s, idx) => (
                                                        <tr key={s.studentId} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{s.name}</td>
                                                            <td className="px-6 py-4 text-center">
                                                                <div className="inline-flex bg-gray-100 dark:bg-slate-900 rounded-lg p-1">
                                                                    {['present', 'absent', 'late'].map(status => (
                                                                        <button
                                                                            key={status}
                                                                            onClick={() => {
                                                                                const newList = [...attendanceList];
                                                                                newList[idx].status = status;
                                                                                setAttendanceList(newList);
                                                                            }}
                                                                            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${s.status === status ? (status === 'present' ? 'bg-emerald-500 text-white shadow-md' : status === 'absent' ? 'bg-red-500 text-white shadow-md' : 'bg-amber-500 text-white shadow-md') : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white'}`}
                                                                        >
                                                                            {status}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <div className="p-6 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700/50 flex justify-end">
                                                <button onClick={handleAttendanceSubmit} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none transition-all">Submit Attendance</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Timetable Tab */}
                            {activeTab === 'timetable' && (
                                <TimetableGrid roleAttr="faculty" isEditable={true} />
                            )}

                            {/* Tests Tab */}
                            {activeTab === 'tests' && (
                                <div>
                                    <div className="flex justify-end mb-6">
                                        <button onClick={() => setModal({ show: true, type: 'test' })} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-purple-200 dark:shadow-none transition-all flex items-center gap-2">
                                            <i className="fas fa-plus text-sm"></i> New Test
                                        </button>
                                    </div>
                                    {isLoading ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}
                                        </div>
                                    ) : tests.length === 0 ? (
                                        <EmptyState title="No Tests Created" message="You haven't created any tests yet." icon="fa-tasks" />
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {tests.map(t => (
                                                <motion.div whileHover={{ y: -5 }} key={t._id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700/50 flex flex-col justify-between">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t.title}</h3>
                                                        <div className="flex gap-2 mt-4">
                                                            <span className="px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs font-bold">Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                                                            <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded text-xs font-bold">{t.marks} Marks</span>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => deleteTest(t._id)} className="mt-6 text-red-500 hover:text-red-600 dark:hover:text-red-400 text-sm font-semibold uppercase tracking-wider bg-red-50 dark:bg-red-900/20 py-2 rounded-lg transition-colors">Delete</button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Assignments Tab */}
                            {activeTab === 'assignments' && (
                                <div>
                                    <div className="flex justify-end mb-6">
                                        <button onClick={() => setModal({ show: true, type: 'assignment' })} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2">
                                            <i className="fas fa-plus text-sm"></i> New Assignment
                                        </button>
                                    </div>
                                    {isLoading ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}
                                        </div>
                                    ) : assignments.length === 0 ? (
                                        <EmptyState title="No Assignments" message="Create an assignment for your students to see it here." icon="fa-file-alt" />
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {assignments.map(a => (
                                                <motion.div whileHover={{ y: -5 }} key={a._id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700/50 flex flex-col justify-between">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{a.title}</h3>
                                                        <div className="flex gap-2 mt-4">
                                                            <span className="px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs font-bold">Due: {new Date(a.dueDate).toLocaleDateString()}</span>
                                                            <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded text-xs font-bold">{a.marks} Marks</span>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => deleteAssignment(a._id)} className="mt-6 text-red-500 hover:text-red-600 dark:hover:text-red-400 text-sm font-semibold uppercase tracking-wider bg-red-50 dark:bg-red-900/20 py-2 rounded-lg transition-colors">Delete</button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Records Tab */}
                            {activeTab === 'records' && (
                                isLoading ? (
                                    <SkeletonTable columns={5} rows={5} />
                                ) : submissions.length === 0 ? (
                                    <EmptyState title="No Records" message="No student submissions received yet." icon="fa-clipboard-check" />
                                ) : (
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 overflow-x-auto overflow-y-hidden">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700/50">
                                                <tr>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Student</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Work</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Submitted</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Grade</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                                {submissions.map(sub => (
                                                    <tr key={sub._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{sub.studentId?.name || 'Unknown'}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">{sub.assignmentId?.title || sub.testId?.title}</span>
                                                                <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 tracking-wider mt-1">
                                                                    {sub.assignmentId ? 'Assignment' : 'Test'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                                                        <td className="px-6 py-4">
                                                            {sub.grade !== undefined ? (
                                                                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold">{sub.grade}</span>
                                                            ) : (
                                                                <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-bold">Pending</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-2 items-center">
                                                                <button 
                                                                    onClick={() => {
                                                                        setModal({ show: true, type: 'grade', data: sub });
                                                                        setGrade(sub.grade || '');
                                                                        setFeedback(sub.feedback || '');
                                                                    }}
                                                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold text-sm bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 block"
                                                                >
                                                                    <i className="fas fa-edit"></i> {sub.grade !== undefined ? 'Re-grade' : 'Grade'}
                                                                </button>
                                                                {sub.filePath && (
                                                                    <a 
                                                                        href={`http://localhost:5001/${sub.filePath}`} 
                                                                        target="_blank" 
                                                                        rel="noreferrer" 
                                                                        download 
                                                                        title="Download Work"
                                                                        className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold text-sm bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                                                    >
                                                                        <i className="fas fa-download"></i> Download
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            )}

                            {/* Analytics Tab */}
                            {activeTab === 'analytics' && (
                                <AnalyticsView role="faculty" userId={user.id} />
                            )}

                            {/* Notices Tab */}
                            {activeTab === 'notices' && (
                                isLoading ? (
                                    <div className="grid gap-6">
                                        {Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}
                                    </div>
                                ) : notices.length === 0 ? (
                                    <EmptyState title="No Notices" message="Currently there are no announcements available." icon="fa-bullhorn" />
                                ) : (
                                    <div className="grid gap-6">
                                        {notices.map(n => (
                                            <motion.div whileHover={{ y: -2 }} key={n._id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                                                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{n.title}</h4>
                                                <p className="text-gray-600 dark:text-slate-300 leading-relaxed">{n.content}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                )
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Modals */}
            <AnimatePresence>
                {modal.show && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-8 max-w-md w-full"
                        >
                            {modal.type === 'grade' ? (
                                <>
                                    <div className="flex justify-between items-start mb-6 border-b border-gray-100 dark:border-slate-700/50 pb-4">
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Grade Submission</h3>
                                            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">{modal.data.studentId.name}</p>
                                        </div>
                                        <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                                            {modal.data.assignmentId ? 'Assignment' : 'Test'}
                                        </div>
                                    </div>
                                    <form onSubmit={handleGradeSubmit} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Score</label>
                                            <input 
                                                type="number" 
                                                value={grade}
                                                onChange={e => setGrade(e.target.value)}
                                                placeholder="Enter marks"
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-gray-900 dark:text-white outline-none transition-all"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Feedback</label>
                                            <textarea 
                                                value={feedback}
                                                onChange={e => setFeedback(e.target.value)}
                                                placeholder="Write your comments here..."
                                                rows="4"
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-gray-900 dark:text-white outline-none transition-all resize-none"
                                            ></textarea>
                                        </div>
                                        <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-slate-700/50">
                                            <button type="button" onClick={() => setModal({ show: false, type: '', data: null })} className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                                            <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none">Save Result</button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white pb-4 border-b border-gray-100 dark:border-slate-700/50">Create New {modal.type === 'test' ? 'Test' : 'Assignment'}</h3>
                                    <form onSubmit={(e) => handleSubmit(e, modal.type)} className="space-y-4">
                                        <select required onChange={e => setFormCourseId(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white outline-none transition-all">
                                            <option value="">Select Course</option>
                                            {courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                                        </select>
                                        <input type="text" placeholder="Title" required onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white outline-none transition-all" />
                                        <input type="date" required onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white outline-none transition-all" />
                                        <input type="number" placeholder="Marks" required onChange={e => setMarks(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white outline-none transition-all" />
                                        {modal.type === 'test' && (
                                            <input type="number" placeholder="Duration (mins)" onChange={e => setDuration(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white outline-none transition-all" />
                                        )}
                                        <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-slate-700/50 mt-4">
                                            <button type="button" onClick={() => setModal({ show: false, type: '', data: null })} className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                                            <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-all">Publish</button>
                                        </div>
                                    </form>
                                </>
                            )}
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
