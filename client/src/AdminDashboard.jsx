import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { useTheme } from './context/ThemeContext';
import { SkeletonTable, SkeletonCard } from './components/ui/Skeleton';
import EmptyState from './components/ui/EmptyState';
import AnalyticsView from './components/AnalyticsView';
import api from './utils/api';

export default function AdminDashboard() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
        { id: 'analytics', label: 'Analytics', icon: 'fa-chart-pie' },
        { id: 'students', label: 'Manage Students', icon: 'fa-user-graduate' },
        { id: 'faculty', label: 'Manage Faculty', icon: 'fa-chalkboard-teacher' },
        { id: 'notices', label: 'Notices', icon: 'fa-bullhorn' }
    ];
    
    const [modal, setModal] = useState({ show: false, type: '' });
    
    const [formData, setFormData] = useState({ name: '', email: '', password: '', roleAttr: '' });
    const [noticeData, setNoticeData] = useState({ title: '', content: '' });

    const [studentSearch, setStudentSearch] = useState('');
    const [debouncedStudentSearch] = useDebounce(studentSearch, 300);

    const [facultySearch, setFacultySearch] = useState('');
    const [debouncedFacultySearch] = useDebounce(facultySearch, 300);

    const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();
    const queryClient = useQueryClient();

    const { data: students = [], isLoading: isStuLoading } = useQuery({
        queryKey: ['users', 'student'],
        queryFn: async () => {
            const res = await api.get('/users?role=student');
            return Array.isArray(res.data) ? res.data : [];
        }
    });

    const { data: faculty = [], isLoading: isFacLoading } = useQuery({
        queryKey: ['users', 'faculty'],
        queryFn: async () => {
            const res = await api.get('/users?role=faculty');
            return Array.isArray(res.data) ? res.data : [];
        }
    });

    const { data: notices = [], isLoading: isNotLoading } = useQuery({
        queryKey: ['notices'],
        queryFn: async () => {
            const res = await api.get('/notices');
            return Array.isArray(res.data) ? res.data : [];
        }
    });

    const isLoading = isStuLoading || isFacLoading || isNotLoading;

    // Filter results locally using React memoized/derived state via debounce
    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(debouncedStudentSearch.toLowerCase()) || 
        s.email.toLowerCase().includes(debouncedStudentSearch.toLowerCase())
    );

    const filteredFaculty = faculty.filter(f => 
        f.name.toLowerCase().includes(debouncedFacultySearch.toLowerCase()) || 
        f.email.toLowerCase().includes(debouncedFacultySearch.toLowerCase())
    );

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
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const deleteUser = async (id, role) => {
        await api.delete(`/users/${id}`);
        queryClient.invalidateQueries({ queryKey: ['users', role] });
    };

    const deleteNotice = async (id) => {
        await api.delete(`/notices/${id}`);
        queryClient.invalidateQueries({ queryKey: ['notices'] });
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        const payload = { name: formData.name, email: formData.email, password: formData.password, role: modal.type };
        if (modal.type === 'student') payload.roleAttr = formData.roleAttr; 
        if (modal.type === 'faculty') payload.roleAttr = formData.roleAttr; 
        
        await api.post('/users', payload);
        
        queryClient.invalidateQueries({ queryKey: ['users', modal.type] });
        setModal({ show: false, type: '' });
    };

    const handleNoticeSubmit = async (e) => {
        e.preventDefault();
        await api.post('/notices', { ...noticeData, author: user.name });
        queryClient.invalidateQueries({ queryKey: ['notices'] });
        setModal({ show: false, type: '' });
    };

    if (!user) return null;

    return (
        <div className="bg-gray-50 dark:bg-slate-950 font-inter min-h-screen flex transition-colors duration-300">
            {/* Sidebar (Desktop) */}
            <aside className={`hidden md:flex flex-col fixed h-screen z-50 transition-all duration-300 ease-in-out bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:border-r border-slate-800 text-white shadow-2xl ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
                <div className="p-6 border-b border-slate-700/50 flex justify-between items-center h-20">
                    {!isSidebarCollapsed && (
                        <div>
                            <h2 className="text-xl font-bold tracking-tight truncate">JIS UNIVERSITY</h2>
                            <p className="text-xs text-indigo-300 dark:text-slate-400 mt-1 uppercase font-semibold">Admin Portal</p>
                        </div>
                    )}
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white outline-none flex-shrink-0">
                        <i className={`fas ${isSidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
                    </button>
                </div>
                <nav className="flex-1 py-6 overflow-y-auto space-y-1 overflow-x-hidden">
                    {tabs.map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id)} 
                            className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-200 border-l-4 group ${activeTab === tab.id ? 'bg-indigo-800/50 dark:bg-indigo-900/40 border-indigo-500' : 'border-transparent hover:bg-white/5 hover:border-indigo-400/30'}`}
                            title={isSidebarCollapsed ? tab.label : ''}
                        >
                            <i className={`fas ${tab.icon} w-5 text-center text-lg ${activeTab === tab.id ? 'text-indigo-400' : 'text-slate-400'}`}></i>
                            {!isSidebarCollapsed && <span className={`font-medium whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-slate-300'}`}>{tab.label}</span>}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-700/50">
                    <button onClick={handleLogout} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl hover:bg-red-500/10 text-slate-300 hover:text-red-400 transition-colors group`}>
                        <i className="fas fa-sign-out-alt text-lg group-hover:-translate-x-1 transition-transform"></i>
                        {!isSidebarCollapsed && <span className="font-medium whitespace-nowrap">Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 flex overflow-x-auto overflow-y-hidden text-center pb-safe">
                {tabs.map(tab => (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`min-w-[80px] h-16 flex-1 flex flex-col justify-center items-center gap-1 transition-colors px-2 border-t-2 ${activeTab === tab.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-transparent text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
                     >
                        <i className={`fas ${tab.icon} text-lg`}></i>
                        <span className="text-[10px] font-bold tracking-tight whitespace-nowrap truncate w-full max-w-[80px]">{tab.label}</span>
                     </button>
                ))}
            </nav>

            {/* Main Content */}
            <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out pb-16 md:pb-0 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-72'} ml-0`}>
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
                                <div>
                                    {isLoading ? (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                                    <i className="fas fa-users text-8xl text-blue-500"></i>
                                                </div>
                                                <div className="w-12 h-12 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl flex items-center justify-center text-xl mb-4 relative z-10"><i className="fas fa-user-graduate"></i></div>
                                                <h3 className="text-3xl font-black text-gray-800 dark:text-white relative z-10">{students.length}</h3>
                                                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1 relative z-10">Total Enrolled Students</p>
                                            </motion.div>
                                            <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                                    <i className="fas fa-chalkboard-teacher text-8xl text-emerald-500"></i>
                                                </div>
                                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl flex items-center justify-center text-xl mb-4 relative z-10"><i className="fas fa-laptop-code"></i></div>
                                                <h3 className="text-3xl font-black text-gray-800 dark:text-white relative z-10">{faculty.length}</h3>
                                                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1 relative z-10">Total Faculty Members</p>
                                            </motion.div>
                                            <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                                    <i className="fas fa-bell text-8xl text-orange-500"></i>
                                                </div>
                                                <div className="w-12 h-12 bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-xl flex items-center justify-center text-xl mb-4 relative z-10"><i className="fas fa-bullhorn"></i></div>
                                                <h3 className="text-3xl font-black text-gray-800 dark:text-white relative z-10">{notices.length}</h3>
                                                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1 relative z-10">Active Notices</p>
                                            </motion.div>
                                            </div>
                                        
                                        <div className="mt-8">
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick System Controls</h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <motion.button 
                                                    whileHover={{ scale: 1.02 }}
                                                    onClick={() => setModal({ show: true, type: 'student' })}
                                                    className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl flex items-center gap-4 text-left transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-900/30 group"
                                                >
                                                    <div className="w-10 h-10 bg-indigo-600 dark:bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-none">
                                                        <i className="fas fa-user-plus"></i>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">Add Student</h4>
                                                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5">Register new scholar</p>
                                                    </div>
                                                </motion.button>

                                                <motion.button 
                                                    whileHover={{ scale: 1.02 }}
                                                    onClick={() => setModal({ show: true, type: 'faculty' })}
                                                    className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl flex items-center gap-4 text-left transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-900/30 group"
                                                >
                                                    <div className="w-10 h-10 bg-emerald-600 dark:bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-200 dark:shadow-none">
                                                        <i className="fas fa-chalkboard-teacher"></i>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">Add Faculty</h4>
                                                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5">Onboard an educator</p>
                                                    </div>
                                                </motion.button>

                                                <motion.button 
                                                    whileHover={{ scale: 1.02 }}
                                                    onClick={() => setModal({ show: true, type: 'notice' })}
                                                    className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 rounded-2xl flex items-center gap-4 text-left transition-colors hover:bg-orange-100 dark:hover:bg-orange-900/30 group"
                                                >
                                                    <div className="w-10 h-10 bg-orange-500 dark:bg-orange-400 rounded-xl flex items-center justify-center text-white shadow-md shadow-orange-200 dark:shadow-none">
                                                        <i className="fas fa-bullhorn"></i>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors">Broadcast Notice</h4>
                                                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5">Send a global alert</p>
                                                    </div>
                                                </motion.button>

                                                <motion.button 
                                                    whileHover={{ scale: 1.02 }}
                                                    onClick={() => setActiveTab('analytics')}
                                                    className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 rounded-2xl flex items-center gap-4 text-left transition-colors hover:bg-purple-100 dark:hover:bg-purple-900/30 group"
                                                >
                                                    <div className="w-10 h-10 bg-purple-600 dark:bg-purple-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-purple-200 dark:shadow-none">
                                                        <i className="fas fa-chart-pie"></i>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">View Analytics</h4>
                                                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5">Explore macro data</p>
                                                    </div>
                                                </motion.button>
                                            </div>
                                        </div>
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
                                    <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
                                        <div className="relative flex-1 min-w-[250px]">
                                            <i className="fas fa-search absolute left-4 top-3.5 text-gray-400"></i>
                                            <input 
                                                type="text" 
                                                placeholder="Search students..." 
                                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white outline-none transition-all"
                                                value={studentSearch}
                                                onChange={(e) => setStudentSearch(e.target.value)}
                                            />
                                        </div>
                                        <button onClick={() => setModal({ show: true, type: 'student' })} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2">
                                            <i className="fas fa-plus text-sm"></i> Add Student
                                        </button>
                                    </div>
                                    {isStuLoading ? (
                                        <SkeletonTable columns={3} rows={5} />
                                    ) : filteredStudents.length === 0 ? (
                                        <EmptyState title="No Students Found" message="No matching results. Try a different search term or get started by adding a student." icon="fa-user-graduate" />
                                    ) : (
                                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 overflow-x-auto overflow-y-hidden">
                                            <table className="w-full text-left">
                                                <thead className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700/50">
                                                    <tr>
                                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                                    {filteredStudents.map(s => (
                                                        <tr key={s._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{s.name}</td>
                                                            <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{s.email}</td>
                                                            <td className="px-6 py-4">
                                                                <button onClick={() => deleteUser(s._id, 'student')} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm font-medium transition-colors">Delete</button>
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
                                    <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
                                        <div className="relative flex-1 min-w-[250px]">
                                            <i className="fas fa-search absolute left-4 top-3.5 text-gray-400"></i>
                                            <input 
                                                type="text" 
                                                placeholder="Search faculty..." 
                                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white outline-none transition-all"
                                                value={facultySearch}
                                                onChange={(e) => setFacultySearch(e.target.value)}
                                            />
                                        </div>
                                        <button onClick={() => setModal({ show: true, type: 'faculty' })} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2">
                                            <i className="fas fa-plus text-sm"></i> Add Faculty
                                        </button>
                                    </div>
                                    {isFacLoading ? (
                                        <SkeletonTable columns={3} rows={5} />
                                    ) : filteredFaculty.length === 0 ? (
                                        <EmptyState title="No Faculty Found" message="No matching results. Try a different search term or get started by adding a faculty member." icon="fa-chalkboard-teacher" />
                                    ) : (
                                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 overflow-x-auto overflow-y-hidden">
                                            <table className="w-full text-left">
                                                <thead className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700/50">
                                                    <tr>
                                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                                    {filteredFaculty.map(f => (
                                                        <tr key={f._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{f.name}</td>
                                                            <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{f.email}</td>
                                                            <td className="px-6 py-4">
                                                                <button onClick={() => deleteUser(f._id, 'faculty')} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm font-medium transition-colors">Delete</button>
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
                                    {isNotLoading ? (
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
