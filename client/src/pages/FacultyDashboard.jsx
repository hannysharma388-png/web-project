import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import AttendanceTable from '../components/AttendanceTable';
import TimetableGrid from '../components/TimetableGrid';

export default function FacultyDashboard() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('students');
    const [students, setStudents] = useState([]);
    const [tests, setTests] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [notices, setNotices] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [modal, setModal] = useState({ show: false, type: '' });
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [marks, setMarks] = useState(0);
    const [duration, setDuration] = useState(45);
    const [toast, setToast] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    useEffect(() => {
        refreshData(user._id);
    }, []);

    const refreshData = async (userId) => {
        try {
            const stuRes = await fetch(`${API_BASE}/users?role=student`);
            setStudents(await stuRes.json());

            const testRes = await fetch(`${API_BASE}/academic/tests`);
            const allTests = await testRes.json();
            setTests(allTests.filter(t => t.authorId?.toString() === userId));

            const assignRes = await fetch(`${API_BASE}/academic/assignments`);
            const allAssignments = await assignRes.json();
            setAssignments(allAssignments.filter(a => a.authorId?.toString() === userId));

            const notRes = await fetch(`${API_BASE}/notices`);
            setNotices(await notRes.json());

            const courseRes = await fetch(`${API_BASE}/academic/courses`);
            setCourses(await courseRes.json());
        } catch (err) {
            console.error('API Error:', err);
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
        await fetch(`${API_BASE}/academic/tests/${id}`, { method: 'DELETE' });
        refreshData(user._id);
        showToast('Test deleted');
    };

    const deleteAssignment = async (id) => {
        await fetch(`${API_BASE}/academic/assignments/${id}`, { method: 'DELETE' });
        refreshData(user._id);
        showToast('Assignment deleted');
    };

    const handleSubmit = async (e, type) => {
        e.preventDefault();
        const payload = { title, dueDate: date, marks, authorId: user._id };
        
        if (type === 'test') {
            payload.duration = duration;
            await fetch(`${API_BASE}/academic/tests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            showToast('Test created!');
        } else {
            await fetch(`${API_BASE}/academic/assignments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            showToast('Assignment created!');
        }
        setModal({ show: false, type: '' });
        refreshData(user._id);
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
            refreshData(user._id);
        } catch (err) {
            showToast('Error marking attendance');
        }
        setLoading(false);
    };

    if (!user) return null;

    const sidebarTabs = [
        { id: 'students', label: 'Student List', icon: 'fa-user-graduate' },
        { id: 'tests', label: 'Tests', icon: 'fa-tasks' },
        { id: 'assignments', label: 'Assignments', icon: 'fa-file-alt' },
        { id: 'attendance', label: 'Mark Attendance', icon: 'fa-calendar-check' },
        { id: 'timetable', label: 'Timetable', icon: 'fa-table' },
        { id: 'notices', label: 'Notices', icon: 'fa-bullhorn' }
    ];

    const getCourseStudents = (courseId) => {
        const course = courses.find(c => c._id === courseId);
        return course ? course.students.map(s => ({ ...s, _id: s._id })) : [];
    };

    return (
        <div className="bg-gray-50 font-inter dashboard-container flex">
            {/* Sidebar */}
            <aside className="sidebar w-72 bg-gradient-to-b from-emerald-900 via-teal-900 to-slate-900 text-white fixed h-screen flex flex-col shadow-2xl z-50">
                <div className="sidebar-header p-6 border-b border-slate-700/50 flex flex-col">
                    <h2 className="text-lg font-bold">JIS UNIVERSITY</h2>
                    <p className="text-xs text-slate-400">Faculty Portal</p>
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

            {/* Main Content */}
            <main className="main-content flex-1 ml-72 min-h-screen">
                <header className="content-header bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-40">
                    <h1 className="text-xl font-semibold text-gray-800">{activeTab.toUpperCase()}</h1>
                    <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white">{user.name.charAt(0)}</div>
                        <div>
                            <p className="text-sm font-medium text-gray-800">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                    </div>
                </header>

                <div className="tab-content p-8">
                    {/* Students Tab */}
                    {activeTab === 'students' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="data-table w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Email</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Course</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(s => (
                                        <tr key={s._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">{s.name}</td>
                                            <td className="px-6 py-4">{s.email}</td>
                                            <td className="px-6 py-4">{s.roleAttr}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Tests Tab */}
                    {activeTab === 'tests' && (
                        <div>
                            <button onClick={() => setModal({ show: true, type: 'test' })} className="mb-6 bg-purple-600 text-white px-6 py-2.5 rounded-xl hover:bg-purple-700">New Test</button>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {tests.map(t => (
                                    <div key={t._id} className="bg-white rounded-2xl p-6 shadow-sm border">
                                        <h3 className="text-lg font-semibold">{t.title}</h3>
                                        <p className="text-sm text-gray-500 mt-2">Due: {new Date(t.dueDate).toLocaleDateString()} | {t.marks} Marks</p>
                                        <button onClick={() => deleteTest(t._id)} className="mt-4 text-red-500 text-sm">Delete</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Assignments Tab */}
                    {activeTab === 'assignments' && (
                        <div>
                            <button onClick={() => setModal({ show: true, type: 'assignment' })} className="mb-6 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700">New Assignment</button>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {assignments.map(a => (
                                    <div key={a._id} className="bg-white rounded-2xl p-6 shadow-sm border">
                                        <h3 className="text-lg font-semibold">{a.title}</h3>
                                        <p className="text-sm text-gray-500 mt-2">Due: {new Date(a.dueDate).toLocaleDateString()} | {a.marks} Marks</p>
                                        <button onClick={() => deleteAssignment(a._id)} className="mt-4 text-red-500 text-sm">Delete</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Attendance Tab */}
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
                                    onMarkAttendance={handleMarkAttendance}
                                    role="faculty" 
                                    loading={loading}
                                />
                            )}
                        </div>
                    )}

                    {/* Timetable Tab */}
                    {activeTab === 'timetable' && (
                        <TimetableGrid roleAttr={user.roleAttr} />
                    )}

                    {/* Notices Tab */}
                    {activeTab === 'notices' && (
                        <div className="grid grid-cols-1 gap-6">
                            {notices.map(n => (
                                <div key={n._id} className="bg-white border rounded-xl p-6 shadow-sm">
                                    <h4 className="text-lg font-semibold">{n.title}</h4>
                                    <p className="text-gray-600 mt-2">{n.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            {modal.show && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
                        <h3 className="text-2xl font-bold mb-6">Create New {modal.type === 'test' ? 'Test' : 'Assignment'}</h3>
                        <form onSubmit={(e) => handleSubmit(e, modal.type)} className="space-y-4">
                            <input type="text" placeholder="Title" required onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 border rounded-xl" />
                            <input type="date" required onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 border rounded-xl" />
                            <input type="number" placeholder="Marks" required onChange={e => setMarks(e.target.value)} className="w-full px-4 py-3 border rounded-xl" />
                            {modal.type === 'test' && (
                                <input type="number" placeholder="Duration (mins)" onChange={e => setDuration(e.target.value)} className="w-full px-4 py-3 border rounded-xl" />
                            )}
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setModal({ show: false, type: '' })} className="flex-1 bg-gray-200 py-3 rounded-xl">Cancel</button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl">Publish</button>
                            </div>
                        </form>
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
