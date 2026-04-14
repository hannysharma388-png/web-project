import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';

const Login = React.lazy(() => import('./Login'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const FacultyDashboard = React.lazy(() => import('./pages/FacultyDashboard'));
const StudentDashboard = React.lazy(() => import('./pages/StudentDashboard'));

const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
);

export default function App() {
    return (
        <Router>
            <SocketProvider>
                <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="/admin/*" element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/faculty/*" element={
                            <ProtectedRoute allowedRoles={['faculty']}>
                                <FacultyDashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/student/*" element={
                            <ProtectedRoute allowedRoles={['student']}>
                                <StudentDashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </Suspense>
                <Toaster position="top-right" />
            </SocketProvider>
        </Router>
    );
}
