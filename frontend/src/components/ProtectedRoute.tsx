import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { ReactNode } from 'react';
import type { UserRole } from '../types';
import { FullscreenLoader } from './ui/Loader';

interface ProtectedRouteProps {
  children: ReactNode;
  role?: UserRole;
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { firebaseUser, appUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullscreenLoader message="Cargando tu sesión…" />;
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!appUser || !appUser.profile_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  if (role && appUser.role !== role) {
    return <Navigate to="/marketplace" replace />;
  }

  return <>{children}</>;
}
