import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './context/ThemeContext';
import { SkeletonTable, SkeletonCard } from './components/ui/Skeleton';
import EmptyState from './components/ui/EmptyState';
import AnalyticsView from './components/AnalyticsView';

export default function AdminDashboard() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [students, setStudents] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [notices, setNotices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modal, setModal] = useState({ show: false, type: '' });
    
    const [formData, setFormData] = useState({ name: '', email: '', password: '', roleAttr: '' });
    const [noticeData, setNoticeData] = useState({ title: '', content: '' });

    const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();
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
        setIsLoading(true);
        try {
            const stuRes = await fetch(`${API_BASE}/users?role=student`);
            setStudents(await stuRes.json());

            const facRes = await fetch(`${API_BASE}/users?role=faculty`);
            setFaculty(await facRes.json());

            const notRes = await fetch(`${API_BASE}/notices`);
            setNotices(await notRes.json());
        } catch (err) {
            console.error('API Error:', err);
        } finally {
            setIsLoading(false);
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
        if (modal.type === 'student') payload.roleAttr = formData.roleAttr; 
        if (modal.type === 'faculty') payload.roleAttr = formData.roleAttr; 
        
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
        <div className="bg-gray-50 dark:bg-slate-950 font-inter min-h-screen flex transition-colors duration-300">
            {/* Sidebar */}
            <aside className="w-72 bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:border-r border-slate-800 text-white fixed h-screen flex flex-col shadow-2xl z-50 transition-colors duration-300">
                <div className="p-6 border-b border-slate-700/50">
                    <h2 className="text-xl font-bold tracking-tight">JIS UNIVERSITY</h2>
                    <p className="text-xs text-indigo-300 dark:text-slate-400 mt-1 uppercase font-semibold">Admin Portal</p>
                </div>
                <nav className="flex-1 py-6 overflow-y-auto space-y-1">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
                        { id: 'analytics', label: 'Analytics', icon: 'fa-chart-pie' },
                        { id: 'students', label: 'Manage Students', icon: 'fa-user-graduate' },
                        { id: 'faculty', label: 'Manage Faculty', icon: 'fa-chalkboard-teacher' },
                        { id: 'notices', label: 'Notices', icon: 'fa-bullhorn' }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id)} 
                            className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-200 border-l-4 ${activeTab === tab.id ? 'bg-indigo-800/50 dark:bg-indigo-900/40 border-indigo-500' : 'border-transparent hover:bg-white/5 hover:border-indigo-400/30'}`}
                        >
                            <i className={`fas ${tab.icon} w-5 text-center ${activeTab === tab.id ? 'text-indigo-400' : 'text-slate-400'}`}></i>
                            <span className={`font-medium ${activeTab === tab.id ? 'text-white' : 'text-slate-300'}`}>{tab.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-6 border-t border-slate-700/50">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-slate-300 hover:text-red-400 transition-colors group">
                        <i className="fas fa-sign-out-alt group-hover:-translate-x-1 transition-transform"></i>
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-72 flex flex-col min-h-screen">
                <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-8 py-4 flex justify-between items-center sticky top-0 z-40 transition-colors duration-300 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white capitalize">{activeTab.replace('-', ' ')}</h1>
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={toggleTheme} 
                            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-yellow-400 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                        </button>
                        <div className="flex items-center gap-3 pr-4 border-r border-gray-200 dark:border-slate-700">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-gray-800 dark:text-white">{user.name}</p>
                                <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">{user.role}</p>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
                                {user.name.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8 flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Dashboard Tab */}
                            {activeTab === 'dashboard' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {isLoading ? (
                                        Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)
                                    ) : (
                                        <>
                                            <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50">
                                                <div className="w-12 h-12 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl flex items-center justify-center text-xl mb-4"><i className="fas fa-users"></i></div>
                                                <h3 className="text-3xl font-black text-gray-800 dark:text-white">{students.length}</h3>
                                                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1">Total Students</p>
                                            </motion.div>
                                            <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50">
                                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl flex items-center justify-center text-xl mb-4"><i className="fas fa-chalkboard-teacher"></i></div>
                                                <h3 className="text-3xl font-black text-gray-800 dark:text-white">{faculty.length}</h3>
                                                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1">Total Faculty</p>
                                            </motion.div>
                                            <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50">
                                                <div className="w-12 h-12 bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-xl flex items-center justify-center text-xl mb-4"><i className="fas fa-bell"></i></div>
                                                <h3 className="text-3xl font-black text-gray-800 dark:text-white">{notices.length}</h3>
                                                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1">Active Notices</p>
                                            </motion.div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Analytics Tab */}
                            {activeTab === 'analytics' && (
                                <AnalyticsView role="admin" />
                            )}

                            {/* Students Tab */}
                            {activeTab === 'students' && (
                                <div>
                                    <div className="flex justify-end mb-6">
                                        <button onClick={() => setModal({ show: true, type: 'student' })} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2">
                                            <i className="fas fa-plus text-sm"></i> Add Student
                                        </button>
                                    </div>
                                    {isLoading ? (
                                        <SkeletonTable columns={3} rows={5} />
                                    ) : students.length === 0 ? (
                                        <EmptyState title="No Students Found" message="Get started by adding a student to the system." icon="fa-user-graduate" />
                                    ) : (
                                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 overflow-hidden">
                                            <table className="w-full text-left">
                                                <thead className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700/50">
                                                    <tr>
                                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                                    {students.map(s => (
                                                        <tr key={s._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{s.name}</td>
                                                            <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{s.email}</td>
                                                            <td className="px-6 py-4">
                                                                <button onClick={() => deleteUser(s._id)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm font-medium transition-colors">Delete</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Faculty Tab */}
                            {activeTab === 'faculty' && (
                                <div>
                                    <div className="flex justify-end mb-6">
                                        <button onClick={() => setModal({ show: true, type: 'faculty' })} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2">
                                            <i className="fas fa-plus text-sm"></i> Add Faculty
                                        </button>
                                    </div>
                                    {isLoading ? (
                                        <SkeletonTable columns={3} rows={5} />
                                    ) : faculty.length === 0 ? (
                                        <EmptyState title="No Faculty Found" message="Get started by adding a faculty member to the system." icon="fa-chalkboard-teacher" />
                                    ) : (
                                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 overflow-hidden">
                                            <table className="w-full text-left">
                                                <thead className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700/50">
                                                    <tr>
                                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                                    {faculty.map(f => (
                                                        <tr key={f._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{f.name}</td>
                                                            <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{f.email}</td>
                                                            <td className="px-6 py-4">
                                                                <button onClick={() => deleteUser(f._id)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm font-medium transition-colors">Delete</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Notices Tab */}
                            {activeTab === 'notices' && (
                                <div>
                                    <div className="flex justify-end mb-6">
                                        <button onClick={() => setModal({ show: true, type: 'notice' })} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-orange-200 dark:shadow-none transition-all flex items-center gap-2">
                                            <i className="fas fa-plus text-sm"></i> Add Notice
                                        </button>
                                    </div>
                                    {isLoading ? (
                                        <div className="grid gap-6">
                                            {Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}
                                        </div>
                                    ) : notices.length === 0 ? (
                                        <EmptyState title="No Notices" message="There are currently no announcements. Create one to notify users." icon="fa-bell" />
                                    ) : (
                                        <div className="grid gap-6">
                                            {notices.map(n => (
                                                <motion.div whileHover={{ y: -2 }} key={n._id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{n.title}</h4>
                                                            <p className="text-gray-600 dark:text-slate-300 leading-relaxed">{n.content}</p>
                                                        </div>
                                                        <button onClick={() => deleteNotice(n._id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10">
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Modals */}
            <AnimatePresence>
                {modal.show && (modal.type === 'student' || modal.type === 'faculty') && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-8 max-w-md w-full"
                        >
                            <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Add new {modal.type}</h3>
                            <form onSubmit={handleUserSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Full Name</label>
                                    <input type="text" required onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Email Address</label>
                                    <input type="email" required onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Temporary Password</label>
                                    <input type="password" required onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">{modal.type === 'student' ? 'Course ID' : 'Department'}</label>
                                    <input type="text" required onChange={e => setFormData({...formData, roleAttr: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white outline-none transition-all" />
                                </div>
                                <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-slate-700/50">
                                    <button type="button" onClick={() => setModal({ show: false, type: '' })} className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                                    <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none">Save User</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {modal.show && modal.type === 'notice' && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                         <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-8 max-w-md w-full"
                        >
                            <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Publish Notice</h3>
                            <form onSubmit={handleNoticeSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Meeting / Title</label>
                                    <input type="text" required onChange={e => setNoticeData({...noticeData, title: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Message</label>
                                    <textarea required onChange={e => setNoticeData({...noticeData, content: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white outline-none transition-all h-32 resize-none"></textarea>
                                </div>
                                <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-slate-700/50">
                                    <button type="button" onClick={() => setModal({ show: false, type: '' })} className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                                    <button type="submit" className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200 dark:shadow-none">Post Notice</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
