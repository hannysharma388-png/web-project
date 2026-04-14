import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [students, setStudents] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [notices, setNotices] = useState([]);
    const [modal, setModal] = useState({ show: false, type: '' });
    
    const [formData, setFormData] = useState({ name: '', email: '', password: '', roleAttr: '' });
    const [noticeData, setNoticeData] = useState({ title: '', content: '' });

    const navigate = useNavigate();
    const API_BASE = 'http://localhost:5001/api';

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'admin') {
            navigate('/');
            return;
        }
        setUser(parsedUser);
        refreshData();
    }, [navigate]);

    const refreshData = async () => {
        try {
            const stuRes = await fetch(`${API_BASE}/users?role=student`);
            setStudents(await stuRes.json());

            const facRes = await fetch(`${API_BASE}/users?role=faculty`);
            setFaculty(await facRes.json());

            const notRes = await fetch(`${API_BASE}/notices`);
            setNotices(await notRes.json());
        } catch (err) {
            console.error('API Error:', err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const deleteUser = async (id) => {
        await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
        refreshData();
    };

    const deleteNotice = async (id) => {
        await fetch(`${API_BASE}/notices/${id}`, { method: 'DELETE' });
        refreshData();
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        const payload = { name: formData.name, email: formData.email, password: formData.password, role: modal.type };
        if (modal.type === 'student') payload.roleAttr = formData.roleAttr; // course
        if (modal.type === 'faculty') payload.roleAttr = formData.roleAttr; // department
        
        await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        setModal({ show: false, type: '' });
        refreshData();
    };

    const handleNoticeSubmit = async (e) => {
        e.preventDefault();
        await fetch(`${API_BASE}/notices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...noticeData, author: user.name })
        });
        setModal({ show: false, type: '' });
        refreshData();
    };

    if (!user) return null;

    return (
        <div className="bg-gray-50 font-inter dashboard-container flex">
            {/* Sidebar */}
            <aside className="sidebar w-72 bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 text-white fixed h-screen flex flex-col shadow-2xl z-50">
                <div className="sidebar-header p-6 border-b border-slate-700/50">
                    <h2 className="text-lg font-bold">JIS UNIVERSITY</h2>
                    <p className="text-xs text-slate-400">Admin Portal</p>
                </div>
                <nav className="sidebar-nav flex-1 py-4 overflow-y-auto">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
                        { id: 'students', label: 'Manage Students', icon: 'fa-user-graduate' },
                        { id: 'faculty', label: 'Manage Faculty', icon: 'fa-chalkboard-teacher' },
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

            <main className="main-content flex-1 ml-72 min-h-screen">
                <header className="content-header bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-40">
                    <h1 className="text-xl font-semibold text-gray-800">{activeTab.toUpperCase()}</h1>
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
                            <button onClick={() => setModal({ show: true, type: 'student' })} className="mb-6 bg-indigo-600 text-white px-6 py-2.5 rounded-xl">Add Student</button>
                            <table className="w-full bg-white rounded-2xl shadow-sm border">
                                <thead><tr><th className="px-6 py-4 text-left">Name</th><th className="px-6 py-4 text-left">Email</th><th className="px-6 py-4 text-left">Actions</th></tr></thead>
                                <tbody>
                                    {students.map(s => (
                                        <tr key={s._id} className="border-t">
                                            <td className="px-6 py-4">{s.name}</td><td className="px-6 py-4">{s.email}</td>
                                            <td className="px-6 py-4"><button onClick={() => deleteUser(s._id)} className="text-red-500">Delete</button></td>
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
        </div>
    );
}
