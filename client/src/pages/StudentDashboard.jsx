import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AttendanceTable from '../components/AttendanceTable';
import TimetableGrid from '../components/TimetableGrid';
import SubmissionModal from '../components/SubmissionModal';
import TestModal from '../components/TestModal';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [tests, setTests] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [notices, setNotices] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [sections, setSections] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [interactionModal, setInteractionModal] = useState({ show: false, type: '', data: null });
    const [uploadModal, setUploadModal] = useState({ show: false, data: null });
    const [testModal, setTestModal] = useState({ show: false, data: null });
    const [toast, setToast] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const navigate = useNavigate();
    const API_BASE = 'http://localhost:5001/api';

    useEffect(() => {
        if (user) {
            refreshData();
        }
    }, [user]);

    const refreshData = async () => {
        try {
            setInitialLoading(true);
            const [testRes, assignRes, subRes, notRes, subjectRes] = await Promise.all([
                api.get('/academic/tests'),
                api.get('/academic/assignments'),
                api.get(`/academic/submissions?studentId=${user.id}`),
                api.get('/notices'),
                api.get('/academic/subjects')
            ]);
            
            setTests(testRes.data);
            setAssignments(assignRes.data);
            setSubmissions(subRes.data);
            setNotices(notRes.data);
            setSubjects(subjectRes.data);
            setInitialLoading(false);
        } catch (err) {
            console.error('API Error:', err);
            setInitialLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
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

    const getMyStudents = () => {
        return []; // Students don't see student lists usually
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
                    <h1 className="text-xl font-semibold text-gray-800">{activeTab?.toUpperCase() || 'DASHBOARD'}</h1>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white">{user.name.charAt(0)}</div>
                        <p className="text-sm font-medium">{user.name}</p>
                    </div>
                </header>

                <div className="tab-content p-8">
                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {initialLoading ? (
                                Array(4).fill().map((_, i) => (
                                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border text-center animate-pulse">
                                        <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-2"></div>
                                        <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border text-center transition-all hover:shadow-md">
                                        <h3 className="text-2xl font-bold text-purple-600">{tests.length}</h3>
                                        <p className="text-gray-500 text-sm font-medium">Upcoming Tests</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border text-center transition-all hover:shadow-md">
                                        <h3 className="text-2xl font-bold text-indigo-600">{assignments.length}</h3>
                                        <p className="text-gray-500 text-sm font-medium">Pending Assignments</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border text-center transition-all hover:shadow-md">
                                        <h3 className="text-2xl font-bold text-green-600">{subjects.length}</h3>
                                        <p className="text-gray-500 text-sm font-medium">Enrolled Subjects</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border text-center transition-all hover:shadow-md">
                                        <h3 className="text-2xl font-bold text-emerald-600">{notices.length}</h3>
                                        <p className="text-gray-500 text-sm font-medium">New Notices</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'tests' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {initialLoading ? (
                                Array(3).fill().map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border animate-pulse">
                                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                                        <div className="h-10 bg-gray-200 rounded w-full"></div>
                                    </div>
                                ))
                            ) : (
                                tests.map(t => (
                                    <div key={t._id} className="bg-white rounded-2xl p-6 shadow-sm border transform hover:-translate-y-1 transition duration-300">
                                        <h3 className="text-lg font-semibold">{t.title}</h3>
                                        <p className={`text-sm mt-2 font-bold ${new Date(t.dueDate) < new Date() ? 'text-red-500' : 'text-gray-800'}`}>Due: {new Date(t.dueDate).toLocaleDateString()}</p>
                                        <p className="text-gray-500 text-sm mt-1">{t.duration} mins • {t.marks} marks</p>
                                        <button onClick={() => setTestModal({ show: true, data: t })} className="mt-4 w-full bg-purple-600 text-white py-2 rounded-lg font-bold hover:bg-purple-700 transition">Take Test</button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'assignments' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {initialLoading ? (
                                Array(3).fill().map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border animate-pulse flex flex-col justify-between h-40">
                                        <div>
                                            <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
                                            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                        </div>
                                        <div className="h-10 bg-gray-200 rounded w-full"></div>
                                    </div>
                                ))
                            ) : (
                                assignments.map(a => {
                                    const submission = submissions.find(s => (s.assignment?._id || s.assignment) === a._id);
                                    const isPastDue = new Date(a.deadline) < new Date();
                                    return (
                                    <div key={a._id} className={`bg-white rounded-2xl p-6 shadow-sm border flex flex-col justify-between ${!isPastDue && !submission ? 'transform hover:-translate-y-1 transition duration-300' : ''}`}>
                                        <div>
                                            <h3 className="text-lg font-semibold">{a.title}</h3>
                                            <p className={`text-sm mt-2 font-bold ${isPastDue ? 'text-red-500' : 'text-gray-600'}`}>Due: {new Date(a.deadline).toLocaleDateString()}</p>
                                        </div>
                                        {submission ? (
                                            <a href={`http://localhost:5001/${submission.file}`} download target="_blank" rel="noreferrer" className="mt-4 w-full bg-green-500/10 text-green-700 border border-green-200 py-2 rounded-lg text-center font-medium hover:bg-green-50 transition-colors inline-block">
                                                <i className="fas fa-check-circle mr-2"></i>Downloaded Submitted File
                                            </a>
                                        ) : isPastDue ? (
                                            <button disabled className="mt-4 w-full bg-gray-100 text-gray-400 py-2 rounded-lg font-medium cursor-not-allowed">
                                                Locked (Past Due)
                                            </button>
                                        ) : (
                                            <div className="mt-4 flex gap-2">
                                                {a.pdfFile && (
                                                    <a href={`http://localhost:5001/${a.pdfFile}`} download target="_blank" rel="noreferrer" className="flex-1 bg-indigo-50 text-indigo-700 border border-indigo-200 py-2 text-sm rounded-lg text-center font-medium hover:bg-indigo-100 transition-colors">
                                                        <i className="fas fa-download mr-1"></i> PDF
                                                    </a>
                                                )}
                                                <button onClick={() => setUploadModal({ show: true, data: a })} className={`flex-[2] bg-indigo-600 text-white py-2 text-sm rounded-lg font-medium hover:bg-indigo-700 transition-colors ${!a.pdfFile && 'w-full flex-1'}`}>
                                                    Submit Work
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )})
                            )}
                        </div>
                    )}

                    {activeTab === 'attendance' && (
                        <div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <select 
                                        value={selectedSubject} 
                                        onChange={(e) => setSelectedSubject(e.target.value)}
                                        className="flex-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Subject</option>
                                        {subjects.map(s => (
                                            <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                                        ))}
                                    </select>
                                    <input 
                                        type="date" 
                                        value={selectedDate} 
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="flex-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            {selectedSubject && (
                                <AttendanceTable 
                                    studentId={user.id} 
                                    date={selectedDate} 
                                    subjectId={selectedSubject} 
                                    role="student" 
                                    loading={loading}
                                />
                            )}
                        </div>
                    )}

                    {activeTab === 'timetable' && (
                        <TimetableGrid fetchUrl="/academic/timetable/student" />
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

            {testModal.show && (
                <TestModal 
                    test={testModal.data} 
                    onClose={() => setTestModal({ show: false, data: null })}
                    onComplete={() => {
                        setTestModal({ show: false, data: null });
                        refreshData();
                    }}
                />
            )}

            {/* Submissions Modal */}
            {uploadModal.show && (
                <SubmissionModal 
                    isOpen={uploadModal.show} 
                    onClose={() => setUploadModal({ show: false, data: null })} 
                    assignment={uploadModal.data} 
                    onSuccess={() => { setToast('Assignment Submitted!'); setUploadModal({ show: false, data: null }); refreshData(); }}
                />
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
