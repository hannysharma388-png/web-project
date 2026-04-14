import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './utils/api';

export default function FacultyDashboard() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('students');
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
    
    const [modal, setModal] = useState({ show: false, type: '', data: null });
    const [title, setTitle] = useState('');
    const [grade, setGrade] = useState('');
    const [feedback, setFeedback] = useState('');
    const [date, setDate] = useState('');
    const [marks, setMarks] = useState(0);
    const [duration, setDuration] = useState(45);
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
        if (parsedUser.role !== 'faculty') {
            navigate('/');
            return;
        }
        setUser(parsedUser);
        refreshData(parsedUser.id);
    }, [navigate]);

    const refreshData = async (userId) => {
        if (!userId) return;
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
        const payload = { title, dueDate: date, marks, authorId: user.id };
        
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
        <div className="bg-gray-50 font-inter dashboard-container flex">
            {/* Sidebar */}
            <aside className="sidebar w-72 bg-gradient-to-b from-emerald-900 via-teal-900 to-slate-900 text-white fixed h-screen flex flex-col shadow-2xl z-50">
                <div className="sidebar-header p-6 border-b border-slate-700/50 flex flex-col">
                    <h2 className="text-lg font-bold">JIS UNIVERSITY</h2>
                    <p className="text-xs text-slate-400">Faculty Portal</p>
                </div>
                <nav className="sidebar-nav flex-1 py-4 overflow-y-auto">
                    {[
                        { id: 'students', label: 'Student List', icon: 'fa-user-graduate' },
                        { id: 'attendance', label: 'Mark Attendance', icon: 'fa-calendar-check' },
                        { id: 'timetable', label: 'Timetable', icon: 'fa-clock' },
                        { id: 'tests', label: 'Tests', icon: 'fa-tasks' },
                        { id: 'assignments', label: 'Assignments', icon: 'fa-file-alt' },
                        { id: 'records', label: 'Records', icon: 'fa-clipboard-check' },
                        { id: 'notices', label: 'Notices', icon: 'fa-bullhorn' }
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

                    {/* Attendance Tab */}
                    {activeTab === 'attendance' && (
                        <div className="max-w-4xl">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6 flex flex-wrap gap-4 items-end">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Course</label>
                                    <select 
                                        className="w-full bg-gray-50 border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
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
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Date</label>
                                    <input 
                                        type="date" 
                                        className="w-full bg-gray-50 border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={attendanceDate}
                                        onChange={(e) => setAttendanceDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            {selectedCourse && (
                                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Student Name</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {attendanceList.map((s, idx) => (
                                                <tr key={s.studentId} className="hover:bg-gray-50/50">
                                                    <td className="px-6 py-4 font-medium">{s.name}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="inline-flex bg-gray-100 rounded-lg p-1">
                                                            {['present', 'absent', 'late'].map(status => (
                                                                <button
                                                                    key={status}
                                                                    onClick={() => {
                                                                        const newList = [...attendanceList];
                                                                        newList[idx].status = status;
                                                                        setAttendanceList(newList);
                                                                    }}
                                                                    className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition-all ${s.status === status ? (status === 'present' ? 'bg-emerald-500 text-white' : status === 'absent' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white') : 'text-gray-400 hover:text-gray-600'}`}
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
                                    <div className="p-6 bg-gray-50 border-t flex justify-end">
                                        <button onClick={handleAttendanceSubmit} className="bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all">Submit Attendance</button>
                                    </div>
                                </div>
                            )}
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
                                                            <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl">
                                                                <p className="text-xs font-bold text-indigo-700 truncate">{slot.subject}</p>
                                                                <p className="text-[10px] text-indigo-500 mt-1 uppercase font-bold">{slot.room}</p>
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

                    {/* Records Tab */}
                    {activeTab === 'records' && (
                        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Student</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Work</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Submitted</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Grade</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {submissions.map(sub => (
                                        <tr key={sub._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{sub.studentId?.name || 'Unknown'}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600 font-semibold">{sub.assignmentId?.title || sub.testId?.title}</span>
                                                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase">
                                                    {sub.assignmentId ? 'Assignment' : 'Test'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                {sub.grade !== undefined ? (
                                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">{sub.grade}</span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">Pending</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => {
                                                        setModal({ show: true, type: 'grade', data: sub });
                                                        setGrade(sub.grade || '');
                                                        setFeedback(sub.feedback || '');
                                                    }}
                                                    className="text-indigo-600 hover:text-indigo-900 font-medium text-sm flex items-center gap-1"
                                                >
                                                    <i className="fas fa-edit"></i> {sub.grade !== undefined ? 'Re-grade' : 'Grade'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full transform transition-all">
                        {modal.type === 'grade' ? (
                            <>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">Grade Submission</h3>
                                        <p className="text-gray-500 text-sm mt-1">Student: {modal.data.studentId.name}</p>
                                    </div>
                                    <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                                        {modal.data.assignmentId ? 'Assignment' : 'Test'}
                                    </div>
                                </div>
                                <form onSubmit={handleGradeSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Score</label>
                                        <input 
                                            type="number" 
                                            value={grade}
                                            onChange={e => setGrade(e.target.value)}
                                            placeholder="Enter marks"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Feedback</label>
                                        <textarea 
                                            value={feedback}
                                            onChange={e => setFeedback(e.target.value)}
                                            placeholder="Write your comments here..."
                                            rows="4"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all resize-none"
                                        ></textarea>
                                    </div>
                                    <div className="flex gap-4 pt-2">
                                        <button type="button" onClick={() => setModal({ show: false, type: '', data: null })} className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
                                        <button type="submit" className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3.5 rounded-2xl font-semibold hover:shadow-lg hover:shadow-indigo-200 transition-all">Save Result</button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <>
                                <h3 className="text-2xl font-bold mb-6 text-gray-900">Create New {modal.type === 'test' ? 'Test' : 'Assignment'}</h3>
                                <form onSubmit={(e) => handleSubmit(e, modal.type)} className="space-y-4">
                                    <input type="text" placeholder="Title" required onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" />
                                    <input type="date" required onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" />
                                    <input type="number" placeholder="Marks" required onChange={e => setMarks(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" />
                                    {modal.type === 'test' && (
                                        <input type="number" placeholder="Duration (mins)" onChange={e => setDuration(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" />
                                    )}
                                    <div className="flex gap-4 pt-2">
                                        <button type="button" onClick={() => setModal({ show: false, type: '', data: null })} className="flex-1 bg-gray-100 py-3 rounded-2xl font-semibold">Cancel</button>
                                        <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-semibold">Publish</button>
                                    </div>
                                </form>
                            </>
                        )}
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
