import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './utils/api';

export default function StudentDashboard() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [tests, setTests] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [notices, setNotices] = useState([]);
    const [myRecords, setMyRecords] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [timetable, setTimetable] = useState([]);
    const [interactionModal, setInteractionModal] = useState({ show: false, type: '', data: null });
    const [toast, setToast] = useState('');

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
        refreshData(parsedUser.id);
    }, [navigate]);

    const refreshData = async (studentId) => {
        if (!studentId) return;
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
        <div className="bg-gray-50 font-inter dashboard-container flex">
            {/* Sidebar */}
            <aside className="sidebar w-72 bg-gradient-to-b from-blue-900 via-indigo-900 to-slate-900 text-white fixed h-screen flex flex-col shadow-2xl z-50">
                <div className="sidebar-header p-6 border-b border-slate-700/50">
                    <h2 className="text-lg font-bold">JIS UNIVERSITY</h2>
                    <p className="text-xs text-slate-400">Student Portal</p>
                </div>
                <nav className="sidebar-nav flex-1 py-4 overflow-y-auto">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: 'fa-home' },
                        { id: 'attendance', label: 'My Attendance', icon: 'fa-calendar-check' },
                        { id: 'timetable', label: 'Class Schedule', icon: 'fa-clock' },
                        { id: 'tests', label: 'My Tests', icon: 'fa-tasks' },
                        { id: 'assignments', label: 'Assignments', icon: 'fa-file-alt' },
                        { id: 'records', label: 'My Records', icon: 'fa-history' },
                        { id: 'notices', label: 'Notice Board', icon: 'fa-bullhorn' }
                    ].map(tab => (
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
                                <h3 className="text-2xl font-bold text-emerald-600">{calculateAttendance()}%</h3>
                                <p className="text-gray-500">Overall Attendance</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
                                <h3 className="text-2xl font-bold text-purple-600">{tests.length}</h3>
                                <p className="text-gray-500">Upcoming Tests</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
                                <h3 className="text-2xl font-bold text-indigo-600">{assignments.length}</h3>
                                <p className="text-gray-500">Pending Assignments</p>
                            </div>
                        </div>
                    )}

                    {/* Attendance Tab */}
                    {activeTab === 'attendance' && (
                        <div className="space-y-6">
                            <div className="bg-white p-8 rounded-2xl shadow-sm border flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">Attendance Summary</h2>
                                    <p className="text-gray-500">Total Classes Tracked: {attendance.length}</p>
                                </div>
                                <div className={`w-24 h-24 rounded-full border-8 flex items-center justify-center text-xl font-black ${parseFloat(calculateAttendance()) > 75 ? 'border-emerald-500 text-emerald-600' : 'border-amber-500 text-amber-600'}`}>
                                    {calculateAttendance()}%
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Class</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {attendance.map(a => (
                                            <tr key={a._id} className="hover:bg-gray-50/50">
                                                <td className="px-6 py-4 text-sm font-medium">{new Date(a.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{a.classId?.name || 'Class'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${a.status === 'present' ? 'bg-emerald-100 text-emerald-700' : a.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {a.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Timetable Tab */}
                    {activeTab === 'timetable' && (
                        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Day</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Period 1</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Period 2</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Period 3</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Period 4</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                                        <tr key={day} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4 font-bold text-gray-700">{day}</td>
                                            {[1, 2, 3, 4].map(period => {
                                                const slot = timetable.find(t => t.day === day && t.period === period);
                                                return (
                                                    <td key={period} className="px-6 py-4">
                                                        {slot ? (
                                                            <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl">
                                                                <p className="text-xs font-bold text-blue-700 truncate">{slot.subject}</p>
                                                                <p className="text-[10px] text-blue-500 mt-1 uppercase font-bold">{slot.teacherId?.name || 'TBA'}</p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-300 text-xs">---</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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

                    {/* Records Tab */}
                    {activeTab === 'records' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Academic Performance History</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {myRecords.length === 0 ? (
                                        <p className="text-gray-500 col-span-3 text-center py-10 italic">No records found. Submit assignments or tests to see your results.</p>
                                    ) : (
                                        myRecords.map(rec => (
                                            <div key={rec._id} className="bg-slate-50 border border-slate-200 p-6 rounded-2xl hover:shadow-md transition-all group">
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider ${rec.assignmentId ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
                                                        {rec.assignmentId ? 'Assignment' : 'Test'}
                                                    </span>
                                                    <span className="text-xs text-gray-400 font-medium">{new Date(rec.submittedAt).toLocaleDateString()}</span>
                                                </div>
                                                <h4 className="font-bold text-gray-800 text-lg group-hover:text-indigo-600 transition-colors">{rec.assignmentId?.title || rec.testId?.title}</h4>
                                                
                                                <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Score</p>
                                                        {rec.grade !== undefined ? (
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-2xl font-black text-indigo-600">{rec.grade}</span>
                                                                <span className="text-xs text-gray-400">/ {rec.assignmentId?.marks || rec.testId?.marks || 100}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm font-bold text-amber-500 italic">Awaiting Grade</span>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                         <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Status</p>
                                                         <span className={`text-xs font-bold ${rec.grade !== undefined ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                            {rec.grade !== undefined ? 'Completed' : 'Processing'}
                                                         </span>
                                                    </div>
                                                </div>
                                                
                                                {rec.feedback && (
                                                    <div className="mt-4 p-3 bg-white border border-slate-100 rounded-xl">
                                                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Feedback</p>
                                                        <p className="text-xs text-slate-600 line-clamp-3 italic">"{rec.feedback}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notices Tab */}
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
