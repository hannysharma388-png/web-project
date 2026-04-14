import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ReportsChart from '../components/ReportsChart';
import toast from 'react-hot-toast';

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
        }
    };

    const { user, logout } = useAuth();
    
    const handleLogout = () => {
        logout();
    };

    const deleteUser = async (id) => {
        await api.delete(`/users/${id}`);
        refreshData();
    };

    const deleteNotice = async (id) => {
        await api.delete(`/notices/${id}`);
        refreshData();
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        const payload = { name: formData.name, email: formData.email, password: formData.password, role: modal.type };
        if (modal.type === 'student') payload.roleAttr = formData.roleAttr; // course
        if (modal.type === 'faculty') payload.roleAttr = formData.roleAttr; // department
        
        await api.post('/users', payload);
        
        setModal({ show: false, type: '' });
        refreshData();
    };

    const handleNoticeSubmit = async (e) => {
        e.preventDefault();
        await api.post('/notices', { ...noticeData, author: user.name });
        setModal({ show: false, type: '' });
        refreshData();
    };

    const handleSubjectSubmit = async (e) => {
        e.preventDefault();
        await api.post('/academic/subjects', subjectData);
        setModal({ show: false, type: '' });
        refreshData();
    };

    const handleSectionSubmit = async (e) => {
        e.preventDefault();
        await api.post('/academic/sections', sectionData);
        setModal({ show: false, type: '' });
        refreshData();
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
        { id: 'notices', label: 'Notices', icon: 'fa-bullhorn' }
    ];

    return (
        <div className="bg-gray-50 font-inter dashboard-container flex">
            {/* Sidebar */}
            <aside className="sidebar w-72 bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 text-white fixed h-screen flex flex-col shadow-2xl z-50">
                <div className="sidebar-header p-6 border-b border-slate-700/50">
                    <h2 className="text-lg font-bold">JIS UNIVERSITY</h2>
                    <p className="text-xs text-slate-400">Admin Portal</p>
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
                        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white">{user.name.charAt(0)}</div>
                        <p className="text-sm font-medium">{user.name}</p>
                    </div>
                </header>

                <div className="tab-content p-8">
                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border"><h3 className="text-2xl font-bold">{students.length}</h3><p className="text-gray-500">Students</p></div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border"><h3 className="text-2xl font-bold">{faculty.length}</h3><p className="text-gray-500">Faculty</p></div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border"><h3 className="text-2xl font-bold">{notices.length}</h3><p className="text-gray-500">Notices</p></div>
                        </div>
                    )}

                    {activeTab === 'students' && (
                        <div>
                            <div className="flex gap-4 mb-6">
                                <button onClick={() => setModal({ show: true, type: 'student' })} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium">Add Student</button>
                                <select 
                                    value={selectedSection} 
                                    onChange={(e) => setSelectedSection(e.target.value)} 
                                    className="px-4 py-2 border border-gray-300 rounded-xl bg-white shadow-sm font-medium"
                                >
                                    <option value="">All Sections</option>
                                    {sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                            <table className="w-full bg-white rounded-2xl shadow-sm border">
                                <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="px-6 py-4 text-left text-gray-500 font-medium">Name</th><th className="px-6 py-4 text-left text-gray-500 font-medium">Email</th><th className="px-6 py-4 text-left text-gray-500 font-medium">Section</th><th className="px-6 py-4 text-left text-gray-500 font-medium">Actions</th></tr></thead>
                                <tbody>
                                    {students
                                        .filter(s => {
                                            if (!selectedSection) return true;
                                            const secName = sections.find(sec => sec._id === selectedSection)?.name;
                                            return s.roleAttr === secName;
                                        })
                                        .map(s => (
                                        <tr key={s._id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-800">{s.name}</td>
                                            <td className="px-6 py-4 text-gray-600">{s.email}</td>
                                            <td className="px-6 py-4 text-indigo-600 font-medium">{s.roleAttr || '-'}</td>
                                            <td className="px-6 py-4"><button onClick={() => deleteUser(s._id)} className="text-red-500 hover:text-red-700 font-medium"><i className="fas fa-trash-alt mr-2"></i>Delete</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'faculty' && (
                        <div>
                            <button onClick={() => setModal({ show: true, type: 'faculty' })} className="mb-6 bg-indigo-600 text-white px-6 py-2.5 rounded-xl">Add Faculty</button>
                            <table className="w-full bg-white rounded-2xl shadow-sm border">
                                <thead><tr><th className="px-6 py-4 text-left">Name</th><th className="px-6 py-4 text-left">Email</th><th className="px-6 py-4 text-left">Actions</th></tr></thead>
                                <tbody>
                                    {faculty.map(f => (
                                        <tr key={f._id} className="border-t">
                                            <td className="px-6 py-4">{f.name}</td><td className="px-6 py-4">{f.email}</td>
                                            <td className="px-6 py-4"><button onClick={() => deleteUser(f._id)} className="text-red-500">Delete</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'subjects' && (
                        <div>
                            <button onClick={() => setModal({ show: true, type: 'subject' })} className="mb-6 bg-green-600 text-white px-6 py-2.5 rounded-xl">Add Subject</button>
                            <div className="grid gap-6">
                                {subjects.map(s => (
                                    <div key={s._id} className="bg-white p-6 rounded-2xl border flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-xl">{s.name}</h4>
                                            <p className="text-gray-500">Code: {s.code}</p>
                                        </div>
                                        <button onClick={() => api.delete(`/academic/subjects/${s._id}`).then(refreshData)} className="text-red-500">Delete</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'sections' && (
                        <div>
                            <button onClick={() => setModal({ show: true, type: 'section' })} className="mb-6 bg-blue-600 text-white px-6 py-2.5 rounded-xl">Add Section</button>
                            <div className="grid gap-6">
                                {sections.map(s => (
                                    <div key={s._id} className="bg-white p-6 rounded-2xl border flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-xl">{s.name}</h4>
                                            <p className="text-gray-500">Branch: {s.branch}</p>
                                            <p className="text-sm text-gray-600">Students: {s.students?.length || 0}</p>
                                        </div>
                                        <button onClick={() => api.delete(`/academic/sections/${s._id}`).then(refreshData)} className="text-red-500">Delete</button>
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

                    {activeTab === 'notices' && (
                        <div>
                            <button onClick={() => setModal({ show: true, type: 'notice' })} className="mb-6 bg-orange-500 text-white px-6 py-2.5 rounded-xl">Create Notice</button>
                            <div className="grid gap-6">
                                {notices.map(n => (
                                    <div key={n._id} className="bg-white p-6 rounded-2xl border"><h4 className="font-bold">{n.title}</h4><p>{n.content}</p><button onClick={() => deleteNotice(n._id)} className="text-red-500 mt-2">Delete</button></div>
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

            {modal.show && modal.type === 'section' && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full">
                        <h3 className="text-2xl font-bold mb-4">Add Section</h3>
                        <form onSubmit={handleSectionSubmit} className="space-y-4">
                            <input type="text" placeholder="Section Name (e.g. BCA-A)" required onChange={e => setSectionData({...sectionData, name: e.target.value})} className="w-full px-4 py-2 border rounded" />
                            <input type="text" placeholder="Branch (e.g. BCA)" required onChange={e => setSectionData({...sectionData, branch: e.target.value})} className="w-full px-4 py-2 border rounded" />
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setModal({ show: false, type: '' })} className="flex-1 bg-gray-200 py-2 rounded">Cancel</button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
