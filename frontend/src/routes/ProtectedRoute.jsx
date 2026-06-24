import { Navigate, useLocation } from 'react-router-dom';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, authLoading, user } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return <Loader className="min-h-[40vh]" label="Checking session" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (user?.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  if (roles?.length && !roles.includes(user?.role)) {
    const destination = user?.role === 'admin'
      ? '/admin/dashboard'
      : user?.role === 'mentor'
        ? '/mentor/dashboard'
        : '/dashboard';
    return <Navigate to={destination} replace />;
  }

  return children;
}
