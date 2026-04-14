import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ReportsChart from '../components/ReportsChart';
import toast from 'react-hot-toast';
import TimetableGrid from '../components/TimetableGrid';

export default function AdminDashboard() {
    // user from AuthContext
    const [activeTab, setActiveTab] = useState('dashboard');
    const [students, setStudents] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [notices, setNotices] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [sections, setSections] = useState([]);
    const [modal, setModal] = useState({ show: false, type: '' });
    
    const [formData, setFormData] = useState({ name: '', email: '', password: '', roleAttr: '' });
    const [noticeData, setNoticeData] = useState({ title: '', content: '' });
    const [subjectData, setSubjectData] = useState({ name: '', code: '' });
    const [sectionData, setSectionData] = useState({ name: '', branch: '' });
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState({ attendance: [], grades: [] });
    const [timetableData, setTimetableData] = useState({ 
        faculty: '', subject: '', section: '', day: 'Monday', startTime: '08:15', endTime: '09:15', room: '', sessionType: 'Lecture' 
    });

    const navigate = useNavigate();
    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = async () => {
        try {
            const stuRes = await api.get('/users?role=student');
            setStudents(stuRes.data);

            const facRes = await api.get('/users?role=faculty');
            setFaculty(facRes.data);

            const notRes = await api.get('/notices');
            setNotices(notRes.data);

            const subRes = await api.get('/academic/subjects');
            setSubjects(subRes.data);

            const secRes = await api.get('/academic/sections');
            setSections(secRes.data);

            try {
                const repRes = await api.get('/reports/attendance-summary');
                const formattedAtt = Object.entries(repRes.data || {})
                    .filter(([key]) => key !== 'totalDays')
                    .map(([status, total]) => ({ _id: status, total }));
                
                const perfRes = await api.get('/reports/performance-metrics');
                
                setReportData({ attendance: formattedAtt, grades: Array.isArray(perfRes.data) ? perfRes.data : [] });
            } catch (repErr) {
                console.error('Reporting Fetch Error:', repErr);
            }
        } catch (err) {
            console.error('Main Dashboard Fetch Error:', err);
            toast.error('Failed to load dashboard data');
            window.alert('Sync Error: Failed to fetch dashboard data. Please check your connection.');
        }
    };

    const { user, logout } = useAuth();
    
    const handleLogout = () => {
        logout();
    };

    const deleteUser = async (id) => {
        try {
            if (!window.confirm("Are you sure you want to delete this user?")) return;
            await api.delete(`/users/${id}`);
            toast.success('User deleted successfully');
            refreshData();
        } catch (err) {
            toast.error('Failed to delete user');
            window.alert('Error: Could not delete user.');
        }
    };

    const deleteNotice = async (id) => {
        try {
            if (!window.confirm("Are you sure you want to delete this notice?")) return;
            await api.delete(`/notices/${id}`);
            toast.success('Notice deleted');
            refreshData();
        } catch (err) {
            toast.error('Failed to delete notice');
            window.alert('Error: Could not delete notice.');
        }
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        const payload = { name: formData.name, email: formData.email, password: formData.password, role: modal.type };
        if (modal.type === 'student') payload.roleAttr = formData.roleAttr; // course
        if (modal.type === 'faculty') payload.roleAttr = formData.roleAttr; // department
        
        try {
            await api.post('/users', payload);
            toast.success(`${modal.type.toUpperCase()} created successfully!`);
            setModal({ show: false, type: '' });
            refreshData();
        } catch (err) {
            toast.error(`Failed to create ${modal.type}`);
            window.alert(`Error: Could not create ${modal.type}.`);
        }
    };

    const handleNoticeSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/notices', { ...noticeData, author: user.name });
            toast.success('Notice published globally!');
            setModal({ show: false, type: '' });
            refreshData();
        } catch (err) {
            toast.error('Failed to publish notice');
            window.alert('Error: Could not publish notice.');
        }
    };

    const handleSubjectSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/academic/subjects', subjectData);
            toast.success(`Subject ${subjectData.code} created!`);
            setModal({ show: false, type: '' });
            refreshData();
        } catch (err) {
            toast.error('Failed to create subject');
            window.alert('Error: Could not create subject.');
        }
    };

    const handleSectionSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/academic/sections', sectionData);
            toast.success(`Section ${sectionData.name} created!`);
            setModal({ show: false, type: '' });
            refreshData();
        } catch (err) {
            toast.error('Failed to create section');
            window.alert('Error: Could not create section.');
        }
    };

    const handleTimetableSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/academic/timetable', timetableData);
            toast.success('Schedule slot created successfully');
            setModal({ show: false, type: '' });
            refreshData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to create schedule slot');
        }
    };

    const getSectionStudents = (sectionId) => {
        const section = sections.find(s => s._id === sectionId);
        return section ? section.students : [];
    };

    const sidebarTabs = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
        { id: 'students', label: 'Manage Students', icon: 'fa-user-graduate' },
        { id: 'faculty', label: 'Manage Faculty', icon: 'fa-chalkboard-teacher' },
        { id: 'subjects', label: 'Subjects', icon: 'fa-book' },
        { id: 'sections', label: 'Sections', icon: 'fa-layer-group' },
        { id: 'reports', label: 'Reports', icon: 'fa-chart-pie' },
        { id: 'timetable', label: 'Master Schedule', icon: 'fa-calendar-alt' },
        { id: 'notices', label: 'Notices', icon: 'fa-bullhorn' }
    ];

    return (
        <div className="bg-gray-50 font-inter dashboard-container flex">
            {/* Sidebar */}
            <aside className="sidebar w-72 bg-gradient-to-b from-indigo-950 via-purple-900 to-slate-900 text-white fixed h-screen flex flex-col shadow-2xl z-50">
                <div className="sidebar-header p-6 border-b border-slate-700/50 flex flex-col">
                    <h2 className="text-lg font-bold">JIS UNIVERSITY</h2>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-tight">Systems Control Center</p>
                </div>
                <nav className="sidebar-nav flex-1 py-6 overflow-y-auto">
                    {sidebarTabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`nav-item w-full flex items-center gap-3 px-5 py-3.5 mx-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-white/10 shadow-inner' : 'hover:bg-white/5 opacity-70 hover:opacity-100'}`}>
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

            <main className="main-content flex-1 ml-72 min-h-screen">
                <header className="content-header bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-40">
                    <h1 className="text-xl font-semibold text-gray-800 tracking-tight">{activeTab?.toUpperCase() || 'SYSTEM CONTROL'}</h1>
                    <div className="flex items-center gap-4 pl-4 border-l border-gray-100">
                        <div className="flex flex-col text-right">
                            <p className="text-sm font-bold text-gray-900 leading-tight">{user?.name || 'Administrator'}</p>
                            <p className="text-xs text-purple-600 font-semibold uppercase tracking-tighter">Root Authority</p>
                        </div>
                        <div className="w-11 h-11 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-200 font-bold text-lg">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                    </div>
                </header>

                <div className="tab-content p-8">
                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { count: students.length, label: 'Students', icon: 'fa-user-graduate', color: 'blue' },
                                { count: faculty.length, label: 'Faculty', icon: 'fa-chalkboard-teacher', color: 'purple' },
                                { count: sections.length, label: 'Active Sections', icon: 'fa-layer-group', color: 'indigo' },
                                { count: notices.length, label: 'Global Notices', icon: 'fa-bullhorn', color: 'amber' }
                            ].map((stat, i) => (
                                <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-xl transition-all relative overflow-hidden">
                                    <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-50 rounded-bl-full -mr-12 -mt-12 opacity-50`}></div>
                                    <div className="relative z-10 flex flex-col gap-4">
                                        <div className={`w-12 h-12 bg-${stat.color}-100 rounded-2xl flex items-center justify-center text-${stat.color}-600`}>
                                            <i className={`fas ${stat.icon} text-lg`}></i>
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-gray-900 mb-1">{stat.count}</h3>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'students' && (
                        <div>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <button onClick={() => setModal({ show: true, type: 'student' })} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2">
                                    <i className="fas fa-plus"></i> Add New Student
                                </button>
                                <select 
                                    value={selectedSection} 
                                    onChange={(e) => setSelectedSection(e.target.value)} 
                                    className="px-5 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm font-bold text-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                >
                                    <option value="">All Academic Sections</option>
                                    {sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Student Credentials</th>
                                            <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Section</th>
                                            <th className="px-6 py-5 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Control</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {students
                                            .filter(s => {
                                                if (!selectedSection) return true;
                                                const secName = sections.find(sec => sec._id === selectedSection)?.name;
                                                return s.roleAttr === secName;
                                            })
                                            .map(s => (
                                            <tr key={s._id} className="hover:bg-gray-50/50 transition-all group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 font-bold group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all uppercase">{s.name.charAt(0)}</div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 leading-tight">{s.name}</p>
                                                            <p className="text-xs text-gray-400 font-medium">{s.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-wider">{s.roleAttr || 'Unassigned'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => deleteUser(s._id)} className="p-2 text-gray-300 hover:text-rose-500 transition-all"><i className="fas fa-trash-alt"></i></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        </div>
                    )}

                    {activeTab === 'faculty' && (
                        <div className="space-y-6">
                            <button onClick={() => setModal({ show: true, type: 'faculty' })} className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 flex items-center gap-2">
                                <i className="fas fa-plus"></i> Add New Faculty
                            </button>
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Faculty Member</th>
                                            <th className="px-6 py-5 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Control</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {faculty.map(f => (
                                            <tr key={f._id} className="hover:bg-gray-50/50 transition-all group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 font-bold group-hover:bg-purple-50 group-hover:text-purple-600 transition-all uppercase">{f.name.charAt(0)}</div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 leading-tight">{f.name}</p>
                                                            <p className="text-xs text-gray-400 font-medium">{f.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => deleteUser(f._id)} className="p-2 text-gray-300 hover:text-rose-500 transition-all"><i className="fas fa-trash-alt"></i></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'subjects' && (
                        <div className="space-y-6">
                            <button onClick={() => setModal({ show: true, type: 'subject' })} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                                <i className="fas fa-plus mr-2"></i>New Subject
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {subjects.map(s => (
                                    <div key={s._id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col group hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                <i className="fas fa-book text-xl"></i>
                                            </div>
                                            <button onClick={() => api.delete(`/academic/subjects/${s._id}`).then(refreshData)} className="p-2 text-gray-300 hover:text-rose-500 transition-all">
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                        <h4 className="font-black text-xl text-gray-900 mb-1">{s.name}</h4>
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{s.code}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'sections' && (
                        <div className="space-y-6">
                            <button onClick={() => setModal({ show: true, type: 'section' })} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                                <i className="fas fa-plus mr-2"></i>New Section
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sections.map(s => (
                                    <div key={s._id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col group hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                <i className="fas fa-layer-group text-xl"></i>
                                            </div>
                                            <button onClick={() => api.delete(`/academic/sections/${s._id}`).then(refreshData)} className="p-2 text-gray-300 hover:text-rose-500 transition-all">
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                        <h4 className="font-black text-xl text-gray-900 mb-1">{s.name}</h4>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{s.branch}</p>
                                        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Enrolled Students</span>
                                            <span className="font-black text-blue-600">{s.students?.length || 0}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'reports' && (
                        <div className="max-w-4xl mx-auto">
                            <ReportsChart 
                                data={reportData.attendance} 
                                title="Global Attendance Summary" 
                            />
                        </div>
                    )}

                    {activeTab === 'timetable' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center mb-2">
                                <button onClick={() => setModal({ show: true, type: 'timetable' })} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2">
                                    <i className="fas fa-plus"></i> Add Schedule Slot
                                </button>
                            </div>
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                                <select 
                                    value={selectedSection} 
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                    className="flex-1 px-5 py-3 bg-gray-50 border-none rounded-2xl font-bold text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                >
                                    <option value="">All Academic Sections</option>
                                    {sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                                <select 
                                    value={selectedSubject} 
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="flex-1 px-5 py-3 bg-gray-50 border-none rounded-2xl font-bold text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                >
                                    <option value="">Specific Faculty View...</option>
                                    {faculty.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                                </select>
                            </div>
                            <TimetableGrid 
                                fetchUrl={`/academic/timetable/all?${selectedSection ? `section=${selectedSection}` : ''}${selectedSubject ? `&faculty=${selectedSubject}` : ''}`} 
                                isEditable={true}
                                onRefresh={refreshData}
                            />
                        </div>
                    )}

                    {activeTab === 'notices' && (
                        <div className="space-y-6">
                            <button onClick={() => setModal({ show: true, type: 'notice' })} className="bg-amber-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-100 flex items-center gap-2">
                                <i className="fas fa-bullhorn"></i> New Global Notice
                            </button>
                            <div className="max-w-4xl space-y-4">
                                {notices.map(n => (
                                    <div key={n._id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-start gap-6 group hover:shadow-md transition-all">
                                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-all">
                                            <i className="fas fa-bullhorn"></i>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-gray-900 text-lg leading-tight">{n.title}</h4>
                                                <button onClick={() => deleteNotice(n._id)} className="text-gray-300 hover:text-rose-500 transition-all p-1">
                                                    <i className="fas fa-trash-alt text-sm"></i>
                                                </button>
                                            </div>
                                            <p className="text-gray-600 leading-relaxed text-sm mb-3">{n.content}</p>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Broadcasted by {n.author || 'Admin'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            {modal.show && (modal.type === 'student' || modal.type === 'faculty') && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full">
                        <h3 className="text-2xl font-bold mb-4">Add {modal.type}</h3>
                        <form onSubmit={handleUserSubmit} className="space-y-4">
                            <input type="text" placeholder="Name" required onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border rounded" />
                            <input type="email" placeholder="Email" required onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border rounded" />
                            <input type="password" placeholder="Password" required onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2 border rounded" />
                            <input type="text" placeholder={modal.type === 'student' ? 'Course' : 'Department'} required onChange={e => setFormData({...formData, roleAttr: e.target.value})} className="w-full px-4 py-2 border rounded" />
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setModal({ show: false, type: '' })} className="flex-1 bg-gray-200 py-2 rounded">Cancel</button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modal.show && modal.type === 'notice' && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full">
                        <h3 className="text-2xl font-bold mb-4">Create Notice</h3>
                        <form onSubmit={handleNoticeSubmit} className="space-y-4">
                            <input type="text" placeholder="Title" required onChange={e => setNoticeData({...noticeData, title: e.target.value})} className="w-full px-4 py-2 border rounded" />
                            <textarea placeholder="Content" required onChange={e => setNoticeData({...noticeData, content: e.target.value})} className="w-full px-4 py-2 border rounded h-32"></textarea>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setModal({ show: false, type: '' })} className="flex-1 bg-gray-200 py-2 rounded">Cancel</button>
                                <button type="submit" className="flex-1 bg-orange-500 text-white py-2 rounded">Publish</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modal.show && modal.type === 'subject' && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full">
                        <h3 className="text-2xl font-bold mb-4">Add Subject</h3>
                        <form onSubmit={handleSubjectSubmit} className="space-y-4">
                            <input type="text" placeholder="Subject Name" required onChange={e => setSubjectData({...subjectData, name: e.target.value})} className="w-full px-4 py-2 border rounded" />
                            <input type="text" placeholder="Subject Code" required onChange={e => setSubjectData({...subjectData, code: e.target.value})} className="w-full px-4 py-2 border rounded" />
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setModal({ show: false, type: '' })} className="flex-1 bg-gray-200 py-2 rounded">Cancel</button>
                                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modal.show && modal.type === 'timetable' && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold mb-6">Create Schedule Slot</h3>
                        <form onSubmit={handleTimetableSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Faculty</label>
                                    <select required className="w-full px-4 py-2 border rounded-xl" onChange={e => setTimetableData({...timetableData, faculty: e.target.value})}>
                                        <option value="">Select Faculty</option>
                                        {faculty.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Subject</label>
                                    <select required className="w-full px-4 py-2 border rounded-xl" onChange={e => setTimetableData({...timetableData, subject: e.target.value})}>
                                        <option value="">Select Subject</option>
                                        {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Section</label>
                                    <select required className="w-full px-4 py-2 border rounded-xl" onChange={e => setTimetableData({...timetableData, section: e.target.value})}>
                                        <option value="">Select Section</option>
                                        {sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Day</label>
                                    <select required value={timetableData.day} className="w-full px-4 py-2 border rounded-xl" onChange={e => setTimetableData({...timetableData, day: e.target.value})}>
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Start Time</label>
                                    <input type="time" required value={timetableData.startTime} className="w-full px-4 py-2 border rounded-xl" onChange={e => setTimetableData({...timetableData, startTime: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">End Time</label>
                                    <input type="time" required value={timetableData.endTime} className="w-full px-4 py-2 border rounded-xl" onChange={e => setTimetableData({...timetableData, endTime: e.target.value})} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Room / Location</label>
                                    <input type="text" placeholder="e.g. 303, Hall A" className="w-full px-4 py-2 border rounded-xl" onChange={e => setTimetableData({...timetableData, room: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Session Type</label>
                                    <select required className="w-full px-4 py-2 border rounded-xl" onChange={e => setTimetableData({...timetableData, sessionType: e.target.value})}>
                                        <option value="Lecture">Lecture</option>
                                        <option value="Lab">Lab</option>
                                        <option value="Seminar">Seminar</option>
                                        <option value="Workshop">Workshop</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setModal({ show: false, type: '' })} className="flex-1 bg-gray-200 py-3 rounded-xl font-bold">Cancel</button>
                                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700">Add to Schedule</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
