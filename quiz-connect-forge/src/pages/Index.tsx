import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { StudentDashboard } from '@/components/student/StudentDashboard';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

const Index = () => {
  const { session } = useAuth();

  // Interface de connexion si pas authentifié
  if (!session.isAuthenticated) {
    return <LoginForm onSuccess={() => {}} />;
  }

  // Interface admin si admin connecté
  if (session.isAdmin) {
    return <AdminDashboard />;
  }

  // Interface étudiant si étudiant connecté
  return <StudentDashboard />;
};

export default Index;
