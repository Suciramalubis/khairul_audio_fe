import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  // 1. Cek Login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Cek Role (Hanya Admin yang boleh lewat)
  if (user.role !== 'admin') {
    // Jika user biasa coba akses admin, lempar ke Home
    return <Navigate to="/" replace />;
  }

  return children;
}