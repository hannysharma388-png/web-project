import React, { useState } from 'react';
import api from './utils/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { setUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password || !role) {
            toast.error('Please fill in all fields.');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email, password, role, rememberMe });
            const data = res.data;
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            
            toast.success('Login successful!');
            
            if (data.user.role === 'admin') navigate('/admin');
            else if (data.user.role === 'faculty') navigate('/faculty');
            else if (data.user.role === 'student') navigate('/student');
        } catch (err) {
            const message = err.response?.data?.message || err.response?.data?.error || 'Connection error. Ensure backend is running.';
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
            <div className="login-container w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900 rounded-lg mb-4">
                        <svg width="40" height="40" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="40" cy="40" r="30" stroke="white" strokeWidth="3" />
                            <path d="M25 48V32L40 22L55 32V48" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M25 40H55" stroke="white" strokeWidth="3" strokeLinecap="round" />
                            <path d="M40 22V52" stroke="white" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">JIS UNIVERSITY</h1>
                    <p className="text-gray-500 text-sm mt-1">Academic Management Portal</p>
                </div>

                <div className="login-card bg-white rounded-lg shadow-md border border-gray-200 p-8">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-800">Sign In</h2>
                        <p className="text-gray-500 text-sm mt-1">Enter your credentials to access the portal</p>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0, y: -20 }}
                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                exit={{ opacity: 0, height: 0, y: -20 }}
                                className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                                        <i className="fas fa-exclamation-triangle"></i>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-red-800">Login Failed</p>
                                        <p className="text-xs text-red-700 mt-0.5">{error}</p>
                                    </div>
                                    <button 
                                        onClick={() => setError('')}
                                        className="ml-auto text-red-400 hover:text-red-600 transition-colors"
                                    >
                                        <i className="fas fa-times text-sm"></i>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="form-group">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email / Username</label>
                            <input
                                type="text"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email or username"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
                            <select
                                id="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                                required
                            >
                                <option value="" disabled>Choose your role</option>
                                <option value="admin">Admin</option>
                                <option value="faculty">Faculty</option>
                                <option value="student">Student</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 border-gray-300 text-blue-900 focus:ring-blue-900" 
                                />
                                <span className="ml-2 text-gray-600">Remember me</span>
                            </label>
                            <a href="#" className="text-blue-900 hover:underline">Forgot Password?</a>
                        </div>

                        <button disabled={loading} type="submit" className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
