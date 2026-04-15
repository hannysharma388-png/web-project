import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import AttendanceTable from '../components/AttendanceTable';
import TimetableGrid from '../components/TimetableGrid';
import toast from 'react-hot-toast';

export default function FacultyDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('students');
    const [students, setStudents] = useState([]);
    const [tests, setTests] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [notices, setNotices] = useState([]);
    const [mySubjects, setMySubjects] = useState([]);
    const [mySections, setMySections] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [modal, setModal] = useState({ show: false, type: '' });
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [marks, setMarks] = useState('');
    const [duration, setDuration] = useState('');
    const [file, setFile] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (user) {
            fetchInitialData();
        }
    }, [user]);

    useEffect(() => {
        if (user && selectedSubject && selectedSection) {
            refreshAcademicData();
        }
    }, [selectedSubject, selectedSection]);

    const fetchInitialData = async () => {
        try {
            const [subRes, notRes] = await Promise.all([
                api.get('/academic/subjects/faculty'),
                api.get('/notices')
            ]);
            setMySubjects(subRes.data);
            setNotices(notRes.data);
        } catch (err) {
            console.error('Initial Fetch Error:', err);
        }
    };

    const refreshAcademicData = async () => {
        try {
            setInitialLoading(true);
            const [testRes, assignRes, stuRes] = await Promise.all([
                api.get(`/academic/tests?subject=${selectedSubject}&section=${selectedSection}`),
                api.get(`/academic/assignments?subject=${selectedSubject}&section=${selectedSection}`),
                api.get(`/users?role=student&section=${selectedSection}`)
            ]);
            setTests(testRes.data);
            setAssignments(assignRes.data);
            setStudents(stuRes.data);
            setInitialLoading(false);
        } catch (err) {
            console.error('Academic Fetch Error:', err);
            setInitialLoading(false);
        }
    };

    const refreshData = () => {
        if (selectedSubject && selectedSection) {
            refreshAcademicData();
        }
    };

    const showToast = (msg, type = 'success') => {
        if (type === 'success') {
            toast.success(msg);
        } else {
            toast.error(msg);
            window.alert('Action Failed: ' + msg);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const deleteTest = async (id) => {
        if (!window.confirm("Are you sure you want to delete this test?")) return;
        await api.delete(`/academic/tests/${id}`);
        refreshData();
        showToast('Test deleted');
    };

    const deleteAssignment = async (id) => {
        if (!window.confirm("Are you sure you want to delete this assignment?")) return;
        await api.delete(`/academic/assignments/${id}`);
        refreshData();
        showToast('Assignment deleted');
    };

    const handleSubmit = async (e, type) => {
        e.preventDefault();
        
        try {
            if (type === 'test') {
                const mappedQuestions = questions.map(q => ({
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.options[q.correctOptionIndex]
                }));
                const payload = { 
                    title, dueDate: date, marks, authorId: user._id,
                    subject: selectedSubject, section: selectedSection, duration,
                    questions: mappedQuestions
                };
                await api.post('/academic/tests', payload);
                showToast('Test created!');
            } else {
                const formData = new FormData();
                formData.append('title', title);
                formData.append('deadline', date);
                formData.append('marks', marks);
                formData.append('subject', selectedSubject);
                formData.append('section', selectedSection);
                formData.append('authorId', user._id);
                if (file) formData.append('pdfFile', file);

                await api.post('/academic/assignments', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showToast('Assignment created!');
            }
            setModal({ show: false, type: '' });
            setTitle(''); setDate(''); setMarks(''); setDuration(''); setFile(null); setQuestions([]);
            refreshData();
        } catch (err) {
            showToast('Error creating ' + type);
        }
    };

    const handleMarkAttendance = async (data) => {
        setLoading(true);
        try {
            await api.post('/academic/attendance/mark', {
                ...data,
                subject: selectedSubject,
                section: selectedSection
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
        { id: 'students', label: 'Student List', icon: 'fa-user-graduate' },
        { id: 'tests', label: 'Tests', icon: 'fa-tasks' },
        { id: 'assignments', label: 'Assignments', icon: 'fa-file-alt' },
        { id: 'attendance', label: 'Mark Attendance', icon: 'fa-calendar-check' },
        { id: 'timetable', label: 'Timetable', icon: 'fa-table' },
        { id: 'notices', label: 'Notices', icon: 'fa-bullhorn' }
    ];

    const getSectionStudents = () => {
        return students;
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
            <aside className={`sidebar w-72 bg-gradient-to-b from-emerald-900 via-teal-900 to-slate-900 text-white fixed h-screen flex flex-col shadow-2xl z-[60] transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="sidebar-header p-6 border-b border-slate-700/50 flex flex-col">
                    <h2 className="text-lg font-bold">JIS UNIVERSITY</h2>
                    <p className="text-xs text-slate-400">Faculty Portal</p>
                </div>
                <nav className="sidebar-nav flex-1 py-4 overflow-y-auto">
                    {sidebarTabs.map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => {
                                setActiveTab(tab.id);
                                setIsSidebarOpen(false);
                            }} 
                            className={`nav-item w-full flex items-center gap-3 px-5 py-3.5 mx-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-slate-800/80 active' : 'hover:bg-slate-800/80'}`}
                        >
                            <i className={`fas ${tab.icon} shrink-0 w-5 text-center`}></i>
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
            <main className="main-content flex-1 lg:ml-72 min-h-screen transition-all duration-300">
                <header className="content-header bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex justify-between items-center sticky top-0 z-40">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            <i className="fas fa-bars text-xl"></i>
                        </button>
                        <h1 className="text-lg lg:text-xl font-semibold text-gray-800 tracking-tight">{activeTab?.toUpperCase() || 'DASHBOARD'}</h1>
                    </div>
                    <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white">{user?.name?.charAt(0) || 'F'}</div>
                        <div>
                            <p className="text-sm font-medium text-gray-800">{user?.name || 'Faculty'}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                    </div>
                </header>

                <div className="tab-content p-8">
                    {/* Academic Context Selector */}
                    {['students', 'tests', 'assignments', 'attendance'].includes(activeTab) && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6 flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Select Subject</label>
                                <select 
                                    value={selectedSubject} 
                                    onChange={(e) => {
                                        setSelectedSubject(e.target.value);
                                        setSelectedSection(''); // Clear section when subject changes
                                        const subject = mySubjects.find(s => s._id === e.target.value);
                                        setMySections(subject ? subject.sections : []);
                                    }}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                                >
                                    <option value="">Choose Subject...</option>
                                    {mySubjects?.map(s => (
                                        <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Select Section</label>
                                <select 
                                    value={selectedSection} 
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                    disabled={!selectedSubject}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">Choose Section...</option>
                                    {mySections?.map(s => (
                                        <option key={s._id} value={s._id}>{s.name} - {s.branch}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {!selectedSubject && !selectedSection && ['students', 'tests', 'assignments', 'attendance'].includes(activeTab) ? (
                        <div className="bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-3xl p-12 text-center">
                            <i className="fas fa-layer-group text-4xl text-emerald-300 mb-4"></i>
                            <h3 className="text-xl font-bold text-emerald-900">Select Subject & Section</h3>
                            <p className="text-emerald-700 mt-2">Please select a subject and section above to view and manage academic data.</p>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'students' && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <table className="data-table w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Name</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Email</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Section</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {initialLoading ? (
                                                <tr><td colSpan="3" className="px-6 py-12 text-center">Loading students...</td></tr>
                                            ) : students.length > 0 ? (
                                                students?.map(s => (
                                                    <tr key={s._id} className="hover:bg-gray-50 border-t border-gray-100">
                                                        <td className="px-6 py-4 font-medium">{s.name}</td>
                                                        <td className="px-6 py-4 text-gray-600">{s.email}</td>
                                                        <td className="px-6 py-4"><span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-bold uppercase">{selectedSection ? mySections?.find(sec => sec._id === selectedSection)?.name : '-'}</span></td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr><td colSpan="3" className="px-6 py-12 text-center text-gray-400">No students found in this section</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === 'tests' && (
                                <div>
                                    <button onClick={() => setModal({ show: true, type: 'test' })} className="mb-6 bg-purple-600 text-white px-6 py-2.5 rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all flex items-center gap-2">
                                        <i className="fas fa-plus"></i> New Test
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {initialLoading ? (
                                            Array(3).fill().map((_, i) => (
                                                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border animate-pulse">
                                                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                                                </div>
                                            ))
                                        ) : tests?.map(t => (
                                            <div key={t._id} className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition-all group">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
                                                        <i className="fas fa-file-alt text-xl"></i>
                                                    </div>
                                                    <button onClick={() => deleteTest(t._id)} className="text-gray-400 hover:text-red-500 transition-all"><i className="fas fa-trash-alt"></i></button>
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-800">{t.title}</h3>
                                                <div className="mt-4 flex flex-wrap gap-3">
                                                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                                        <i className="far fa-calendar"></i> {new Date(t.dueDate || t.deadline).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                                        <i className="fas fa-star"></i> {t.marks} Marks
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'assignments' && (
                                <div>
                                    <button onClick={() => setModal({ show: true, type: 'assignment' })} className="mb-6 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">
                                        <i className="fas fa-plus"></i> New Assignment
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {initialLoading ? (
                                            Array(3).fill().map((_, i) => (
                                                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border animate-pulse">
                                                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                                                </div>
                                            ))
                                        ) : assignments?.map(a => (
                                            <div key={a._id} className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition-all group">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                        <i className="fas fa-file-pdf text-xl"></i>
                                                    </div>
                                                    <button onClick={() => deleteAssignment(a._id)} className="text-gray-400 hover:text-red-500 transition-all"><i className="fas fa-trash-alt"></i></button>
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-800">{a.title}</h3>
                                                <div className="mt-4 flex flex-wrap gap-3">
                                                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                                        <i className="far fa-calendar-alt"></i> {new Date(a.deadline || a.dueDate).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                                        <i className="fas fa-check-circle"></i> {a.marks} Marks
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'attendance' && (
                                <div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Date</label>
                                                <input 
                                                    type="date" 
                                                    value={selectedDate} 
                                                    onChange={(e) => setSelectedDate(e.target.value)}
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <AttendanceTable 
                                        students={getSectionStudents()} 
                                        date={selectedDate} 
                                        subjectId={selectedSubject}
                                        sectionId={selectedSection}
                                        onMarkAttendance={handleMarkAttendance}
                                        role="faculty" 
                                        loading={loading}
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {/* Timetable Tab */}
                    {activeTab === 'timetable' && (
                        <TimetableGrid fetchUrl="/academic/timetable/faculty" />
                    )}

                    {/* Notices Tab */}
                    {activeTab === 'notices' && (
                        <div className="grid grid-cols-1 gap-6">
                            {notices?.map(n => (
                                <div key={n._id} className="bg-white border rounded-xl p-6 shadow-sm">
                                    <h4 className="text-lg font-semibold">{n.title}</h4>
                                    <p className="text-gray-600 mt-2">{n.content} (Published: {new Date(n.date || n.createdAt).toLocaleDateString()})</p>
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
                            {modal.type === 'test' ? (
                                <>
                                    <input type="number" placeholder="Duration (mins)" onChange={e => setDuration(e.target.value)} className="w-full px-4 py-3 border rounded-xl" />
                                    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 max-h-72 overflow-y-auto space-y-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="font-semibold text-gray-700">Questions ({questions.length})</label>
                                            <button type="button" onClick={() => setQuestions([...questions, { question: '', options: ['', '', '', ''], correctOptionIndex: 0 }])} className="bg-indigo-100 text-indigo-700 px-3 py-1 text-sm rounded-lg hover:bg-indigo-200">
                                                <i className="fas fa-plus"></i> Add MCQ
                                            </button>
                                        </div>
                                        {questions.map((q, idx) => (
                                            <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative pt-8">
                                                <button type="button" onClick={() => {
                                                    const ql = [...questions]; ql.splice(idx, 1); setQuestions(ql);
                                                }} className="absolute top-2 right-3 text-red-400 hover:text-red-600"><i className="fas fa-trash"></i></button>
                                                <span className="absolute top-2 left-3 text-xs font-bold text-gray-400">Q{idx + 1}</span>
                                                <input type="text" placeholder="Enter question..." required value={q.question} onChange={e => {
                                                    const ql = [...questions]; ql[idx].question = e.target.value; setQuestions(ql);
                                                }} className="w-full px-3 py-2 border rounded-lg mb-3" />
                                                <div className="grid grid-cols-2 gap-2">
                                                    {q.options.map((opt, oIdx) => (
                                                        <div key={oIdx} className="flex items-center gap-2">
                                                            <input type="radio" name={`correctOption_${idx}`} required checked={q.correctOptionIndex === oIdx} onChange={() => {
                                                                const ql = [...questions]; ql[idx].correctOptionIndex = oIdx; setQuestions(ql);
                                                            }} className="w-4 h-4 text-emerald-500" />
                                                            <input type="text" placeholder={`Option ${oIdx + 1}`} required value={opt} onChange={e => {
                                                                const ql = [...questions]; ql[idx].options[oIdx] = e.target.value; setQuestions(ql);
                                                            }} className="flex-1 px-2 py-1 border rounded-md text-sm" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (PDF)</label>
                                    <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files[0])} className="w-full px-4 py-2 border rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-50 file:text-indigo-600" />
                                </div>
                            )}
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setModal({ show: false, type: '' })} className="flex-1 bg-gray-200 py-3 rounded-xl">Cancel</button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl">Publish</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
