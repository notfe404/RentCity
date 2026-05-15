import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';
import { ROUTES } from '@/constants/routes';
import Spinner from '@/components/ui/Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Nếu truyền vào — bắt buộc user phải có 1 trong những role này.
   * Nếu không truyền — chỉ cần đăng nhập là đủ.
   */
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isLoggedIn, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to={ROUTES.HOME} state={{ from: location, openAuth: true }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect về đúng trang chủ của từng role
    if (user.role === 'ADMIN' || user.role === 'STAFF') {
      return <Navigate to={ROUTES.ADMIN} replace />;
    }
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <>{children}</>;
}
