import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext.jsx';
import { LoadingState } from '../components/FeedbackStates.jsx';

export function PublicOnlyRoute() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState label="Checking campus session..." rows={1} />;
  }

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : '/app'} replace />;
  }

  return <Outlet />;
}

export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState label="Restoring campus session..." rows={2} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export function RequireVerifiedStudent() {
  const { user, isAuthenticated, isVerifiedStudent, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState label="Checking institutional verification..." rows={2} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isVerifiedStudent) {
    const email = user?.collegeEmail || user?.email || '';
    return (
      <Navigate
        to={`/verify-email?email=${encodeURIComponent(email)}`}
        replace
      />
    );
  }

  return <Outlet />;
}

export function RequireAdmin() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState label="Verifying administrator privileges..." rows={2} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
