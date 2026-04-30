import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { FullscreenLoader } from './components/ui/Loader';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
          <Route path="/forgot-password" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />

          <Route path="/onboarding" element={<OnboardingPage />} />

          <Route
            path="/marketplace"
            element={
              <ProtectedRoute>
                <MarketplacePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { firebaseUser, appUser, loading } = useAuth();
  if (loading) return <FullscreenLoader message="Cargando…" />;
  if (firebaseUser && appUser?.profile_completed) {
    return <Navigate to="/marketplace" replace />;
  }
  if (firebaseUser && (!appUser || !appUser.profile_completed)) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

function RootRedirect() {
  const { firebaseUser, appUser, loading } = useAuth();
  if (loading) return <FullscreenLoader message="Cargando…" />;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (!appUser || !appUser.profile_completed) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/marketplace" replace />;
}

export default App;
