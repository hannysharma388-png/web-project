import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AttendanceTable from '../components/AttendanceTable';
import TimetableGrid from '../components/TimetableGrid';

export default function StudentDashboard() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [tests, setTests] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [notices, setNotices] = useState([]);
    const [courses, setCourses] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [interactionModal, setInteractionModal] = useState({ show: false, type: '', data: null });
    const [toast, setToast] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const API_BASE = 'http://localhost:5001/api';

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
        refreshData();
    }, [navigate]);

    const refreshData = async () => {
        try {
            const testRes = await fetch(`${API_BASE}/academic/tests`);
            setTests(await testRes.json());

            const assignRes = await fetch(`${API_BASE}/academic/assignments`);
            setAssignments(await assignRes.json());

            const notRes = await fetch(`${API_BASE}/notices`);
            setNotices(await notRes.json());

            const courseRes = await fetch(`${API_BASE}/academic/courses`);
            setCourses(await courseRes.json());

            const stuRes = await fetch(`${API_BASE}/users?role=student`);
            setStudents(await stuRes.json());
        } catch (err) {
            console.error('API Error:', err);
        }
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

    const executeInteraction = () => {
        setInteractionModal({ show: false, type: '', data: null });
        showToast(`Successfully submitted!`);
    };

    const handleMarkAttendance = async (data) => {
        setLoading(true);
        try {
            await fetch(`${API_BASE}/academic/attendance/mark`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            showToast('Attendance marked!');
            refreshData();
        } catch (err) {
            showToast('Error marking attendance');
        }
        setLoading(false);
    };

    if (!user) return null;

    const sidebarTabs = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-home' },
        { id: 'tests', label: 'My Tests', icon: 'fa-tasks' },
        { id: 'assignments', label: 'Assignments', icon: 'fa-file-alt' },
        { id: 'attendance', label: 'Attendance', icon: 'fa-calendar-check' },
        { id: 'timetable', label: 'Timetable', icon: 'fa-table' },
        { id: 'notices', label: 'Notice Board', icon: 'fa-bullhorn' }
    ];

    const getCourseStudents = (courseId) => {
        const course = courses.find(c => c._id === courseId);
        return course ? course.students : [];
    };

    return (
        <div className="bg-gray-50 font-inter dashboard-container flex">
            {/* Sidebar */}
            <aside className="sidebar w-72 bg-gradient-to-b from-blue-900 via-indigo-900 to-slate-900 text-white fixed h-screen flex flex-col shadow-2xl z-50">
                <div className="sidebar-header p-6 border-b border-slate-700/50">
                    <h2 className="text-lg font-bold">JIS UNIVERSITY</h2>
                    <p className="text-xs text-slate-400">Student Portal</p>
                </div>
                <nav className="sidebar-nav flex-1 py-4 overflow-y-auto">
                    {sidebarTabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`nav-item w-full flex items-center gap-3 px-5 py-3.5 mx-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-slate-800/80 active' : 'hover:bg-slate-800/80'}`}>
                            <i className={`fas ${tab.icon} shrink-0`}></i>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-700/50">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl hover:bg-red-500/20 text-red-400 transition-all">
                        <i className="fas fa-sign-out-alt"></i><span>Logout</span>
                    </button>
                </div>
            </aside>

            <main className="main-content flex-1 ml-72 min-h-screen">
                <header className="content-header bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-40">
                    <h1 className="text-xl font-semibold text-gray-800">{activeTab.toUpperCase()}</h1>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white">{user.name.charAt(0)}</div>
                        <p className="text-sm font-medium">{user.name}</p>
                    </div>
                </header>

                <div className="tab-content p-8">
                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
                                <h3 className="text-2xl font-bold text-purple-600">{tests.length}</h3>
                                <p className="text-gray-500">Upcoming Tests</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
                                <h3 className="text-2xl font-bold text-indigo-600">{assignments.length}</h3>
                                <p className="text-gray-500">Pending Assignments</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
                                <h3 className="text-2xl font-bold text-green-600">{courses.length}</h3>
                                <p className="text-gray-500">Enrolled Courses</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
                                <h3 className="text-2xl font-bold text-emerald-600">{notices.length}</h3>
                                <p className="text-gray-500">New Notices</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tests' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tests.map(t => (
                                <div key={t._id} className="bg-white rounded-2xl p-6 shadow-sm border transform hover:-translate-y-1 transition duration-300">
                                    <h3 className="text-lg font-semibold">{t.title}</h3>
                                    <p className="text-sm text-red-500 mt-2 font-bold">Due: {new Date(t.dueDate).toLocaleDateString()}</p>
                                    <p className="text-gray-500 text-sm mt-1">{t.duration} mins • {t.marks} marks</p>
                                    <button onClick={() => setInteractionModal({ show: true, type: 'test', data: t })} className="mt-4 w-full bg-purple-600 text-white py-2 rounded-lg">Take Test</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'assignments' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {assignments.map(a => (
                                <div key={a._id} className="bg-white rounded-2xl p-6 shadow-sm border transform hover:-translate-y-1 transition duration-300">
                                    <h3 className="text-lg font-semibold">{a.title}</h3>
                                    <p className="text-sm text-red-500 mt-2 font-bold">Due: {new Date(a.dueDate).toLocaleDateString()}</p>
                                    <button onClick={() => setInteractionModal({ show: true, type: 'assignment', data: a })} className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg">Submit Work</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'attendance' && (
                        <div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <select 
                                        value={selectedCourse} 
                                        onChange={(e) => setSelectedCourse(e.target.value)}
                                        className="flex-1 px-4 py-2 border rounded-xl"
                                    >
                                        <option value="">Select Course</option>
                                        {courses.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <input 
                                        type="date" 
                                        value={selectedDate} 
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="flex-1 px-4 py-2 border rounded-xl"
                                    />
                                </div>
                            </div>
                            {selectedCourse && (
                                <AttendanceTable 
                                    students={getCourseStudents(selectedCourse)} 
                                    date={selectedDate} 
                                    classId={selectedCourse} 
                                    role="student" 
                                    loading={loading}
                                />
                            )}
                        </div>
                    )}

                    {activeTab === 'timetable' && (
                        <TimetableGrid roleAttr={user.roleAttr} />
                    )}

                    {activeTab === 'notices' && (
                        <div className="grid gap-6">
                            {notices.map(n => (
                                <div key={n._id} className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                                    <h4 className="font-bold text-orange-900">{n.title}</h4>
                                    <p className="text-gray-700 mt-2">{n.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Modals Simulation */}
            {interactionModal.show && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-lg w-full text-center">
                        <i className={`fas ${interactionModal.type === 'test' ? 'fa-hourglass-half text-purple-500' : 'fa-cloud-upload-alt text-indigo-500'} text-5xl mb-4`}></i>
                        <h3 className="text-2xl font-bold mb-2">{interactionModal.data.title}</h3>
                        <p className="text-gray-600 mb-6">{interactionModal.type === 'test' ? 'Prepare to take the quiz.' : 'Upload your PDF work here.'}</p>
                        <div className="flex gap-4">
                            <button onClick={() => setInteractionModal({ show: false, type: '', data: null })} className="flex-1 bg-gray-200 py-3 rounded-lg">Cancel</button>
                            <button onClick={executeInteraction} className={`flex-1 text-white py-3 rounded-lg ${interactionModal.type === 'test' ? 'bg-purple-600' : 'bg-indigo-600'}`}>
                                {interactionModal.type === 'test' ? 'Submit Test' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-5 right-5 bg-white rounded-xl shadow-2xl p-4 z-50 flex items-center gap-3">
                    <i className="fas fa-check-circle text-emerald-500"></i>
                    <p className="font-semibold text-gray-800">{toast}</p>
                </div>
            )}
        </div>
    );
}
