'use client';

import React from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import LoginPage from '../components/LoginPage';
import Dashboard from '../components/Dashboard';

function AppContent() {
  const { user } = useAuth();
  return user ? <Dashboard /> : <LoginPage />;
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
