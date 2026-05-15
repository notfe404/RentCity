import { useContext } from 'react';
import { AuthContext } from '@/store/authStore';

/**
 * Hook để dùng Auth trong bất kỳ component nào.
 *
 * @example
 * const { user, isLoggedIn, login, logout } = useAuth();
 * if (user?.role === 'ADMIN') { ... }
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth phải được dùng bên trong <AuthProvider>');
  }
  return ctx;
}
