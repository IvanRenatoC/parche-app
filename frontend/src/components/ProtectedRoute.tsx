import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { ReactNode } from 'react';
import type { UserRole } from '../types';
import { Spinner } from './ui/Card';

interface ProtectedRouteProps {
  children: ReactNode;
  role?: UserRole;
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { firebaseUser, appUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (!firebaseUser) return <Navigate to="/login" replace />;

  if (appUser && !appUser.profile_completed && !window.location.pathname.startsWith('/register')) {
    return <Navigate to="/register/complete" replace />;
  }

  if (role && appUser?.role !== role) {
    return <Navigate to="/marketplace" replace />;
  }

  return <>{children}</>;
}
