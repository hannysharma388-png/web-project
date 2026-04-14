import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './Login';
import AdminDashboard from './AdminDashboard';
import FacultyDashboard from './FacultyDashboard';
import StudentDashboard from './StudentDashboard';
import { useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

export default function App() {
    return (
        <Router>
            <SocketProvider>
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
            </SocketProvider>
        </Router>
    );
}
