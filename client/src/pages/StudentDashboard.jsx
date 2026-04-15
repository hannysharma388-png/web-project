import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
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
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const navigate = useNavigate();

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

    const showToast = (msg, type = 'success') => {
        if (type === 'success') {
            toast.success(msg);
        } else {
            toast.error(msg);
            window.alert('Error: ' + msg);
        }
    };

    const handleMarkAttendance = async (data) => {
        setLoading(true);
        try {
            await api.post('/academic/attendance/mark', data);
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
        <div className="bg-gray-50 font-inter min-h-screen relative flex">
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] lg:hidden transition-opacity" 
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar w-72 bg-gradient-to-b from-indigo-950 via-blue-900 to-slate-900 text-white fixed h-screen flex flex-col shadow-2xl z-[60] transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="sidebar-header p-6 border-b border-slate-700/50 flex flex-col">
                    <h2 className="text-lg font-bold">JIS UNIVERSITY</h2>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-tight">Student Success Portal</p>
                </div>
                <nav className="sidebar-nav flex-1 py-6 overflow-y-auto">
                    {sidebarTabs.map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => {
                                setActiveTab(tab.id);
                                setIsSidebarOpen(false);
                            }} 
                            className={`nav-item w-full flex items-center gap-3 px-5 py-3.5 mx-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-white/10 shadow-inner' : 'hover:bg-white/5 opacity-70 hover:opacity-100'}`}
                        >
                            <i className={`fas ${tab.icon} shrink-0 w-5`}></i>
                            <span className="font-medium">{tab.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-700/50">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl hover:bg-red-500/10 text-red-400 transition-all">
                        <i className="fas fa-sign-out-alt"></i><span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            <main className="main-content flex-1 lg:ml-72 min-h-screen transition-all duration-300">
                <header className="content-header bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex justify-between items-center sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            <i className="fas fa-bars text-xl"></i>
                        </button>
                        <h1 className="text-lg lg:text-xl font-semibold text-gray-800 tracking-tight">{activeTab?.toUpperCase() || 'OVERVIEW'}</h1>
                    </div>
                    <div className="flex items-center gap-4 pl-4 border-l border-gray-100">
                        <div className="flex flex-col text-right">
                            <p className="text-sm font-bold text-gray-900 leading-tight">{user?.name || 'Student'}</p>
                            <p className="text-xs text-blue-600 font-semibold">{user?.roleAttr || 'B.Tech CS'}</p>
                        </div>
                        <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 font-bold text-lg">
                            {user?.name?.charAt(0) || 'S'}
                        </div>
                    </div>
                </header>

                <div className="tab-content p-8">
                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { count: tests?.length || 0, label: 'Upcoming Tests', icon: 'fa-tasks', color: 'purple' },
                                { count: assignments?.length || 0, label: 'Pending Work', icon: 'fa-file-alt', color: 'indigo' },
                                { count: subjects?.length || 0, label: 'Enrolled Courses', icon: 'fa-university', color: 'blue' },
                                { count: notices?.length || 0, label: 'Unread Notices', icon: 'fa-bullhorn', color: 'emerald' }
                            ].map((stat, i) => (
                                <div key={i} className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all group relative overflow-hidden`}>
                                    <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-50 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:scale-150 opacity-50`}></div>
                                    <div className="relative z-10 flex flex-col gap-4">
                                        <div className={`w-12 h-12 bg-${stat.color}-100 rounded-2xl flex items-center justify-center text-${stat.color}-600`}>
                                            <i className={`fas ${stat.icon} text-lg`}></i>
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-gray-900 mb-1">{stat.count}</h3>
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'tests' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tests.map(t => (
                                <div key={t._id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
                                            <i className="fas fa-tasks text-xl"></i>
                                        </div>
                                        <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold uppercase">{t.subject?.name || 'Subject'}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{t.title}</h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                                        <span className={`font-bold ${new Date(t.dueDate) < new Date() ? 'text-rose-500' : 'text-blue-600'}`}>
                                            <i className="far fa-clock mr-1.5"></i>{new Date(t.dueDate).toLocaleDateString()}
                                        </span>
                                        <span><i className="far fa-star mr-1.5"></i>{t.marks} Marks</span>
                                    </div>
                                    <button onClick={() => setTestModal({ show: true, data: t })} className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                                        Attempt Exam
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'assignments' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {assignments.map(a => {
                                const submission = submissions.find(s => (s.assignment?._id || s.assignment) === a._id);
                                const isPastDue = new Date(a.deadline) < new Date();
                                return (
                                <div key={a._id} className={`bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col group hover:shadow-md transition-all`}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <i className="fas fa-file-pdf text-xl"></i>
                                        </div>
                                        {submission ? (
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold uppercase">Submitted</span>
                                        ) : (
                                            <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold uppercase">Pending</span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{a.title}</h3>
                                    <p className={`text-sm mb-6 font-bold ${isPastDue ? 'text-rose-500' : 'text-gray-500'}`}>
                                        <i className="far fa-calendar-alt mr-1.5"></i>Due: {new Date(a.deadline).toLocaleDateString()}
                                    </p>
                                    
                                    <div className="mt-auto space-y-3">
                                        {a.pdfFile && (
                                            <a href={`${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/${a.pdfFile}`} download target="_blank" rel="noreferrer" className="w-full bg-blue-50 text-blue-700 border border-blue-100 py-3 text-sm rounded-xl text-center font-bold hover:bg-blue-100 transition-all flex items-center justify-center gap-2">
                                                <i className="fas fa-file-download"></i> Question Paper
                                            </a>
                                        )}
                                        
                                        {submission ? (
                                            <a href={`${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/${submission.file}`} download target="_blank" rel="noreferrer" className="w-full block bg-emerald-600 text-white py-3.5 rounded-2xl text-sm text-center font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                                                <i className="fas fa-check-circle mr-2"></i> My Submission
                                            </a>
                                        ) : isPastDue ? (
                                            <button disabled className="w-full bg-gray-100 text-gray-400 py-3.5 rounded-2xl font-bold uppercase tracking-wider text-xs">
                                                Deadline Missed
                                            </button>
                                        ) : (
                                            <button onClick={() => setUploadModal({ show: true, data: a })} className="w-full bg-blue-600 text-white py-3.5 text-sm rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                                                Submit Assignment
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )})}
                        </div>
                    )}

                    {activeTab === 'attendance' && (
                        <div>
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
                                <div className="flex flex-col md:flex-row gap-6 items-end">
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Select Subject</label>
                                        <select 
                                            value={selectedSubject} 
                                            onChange={(e) => setSelectedSubject(e.target.value)}
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                        >
                                            <option value="">Choose Course...</option>
                                            {subjects?.map(s => (
                                                <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Select Date</label>
                                        <input 
                                            type="date" 
                                            value={selectedDate} 
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                        />
                                    </div>
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
                        <div className="max-w-4xl space-y-4">
                            {notices?.map(n => (
                                <div key={n._id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex gap-6 items-start hover:shadow-md transition-all group">
                                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-all">
                                        <i className="fas fa-bullhorn"></i>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-gray-900 text-lg">{n.title}</h4>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{new Date(n.date || n.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-gray-600 leading-relaxed text-sm">{n.content}</p>
                                    </div>
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
                    onSuccess={() => { showToast('Assignment Submitted!'); setUploadModal({ show: false, data: null }); refreshData(); }}
                />
            )}
        </div>
    );
}
