import { useContext } from 'react';
import { AuthContext } from '@/store/authStore';

/**
 * Hook for using Auth in any component.
 *
 * @example
 * const { user, isLoggedIn, login, logout } = useAuth();
 * if (user?.role === 'ADMIN') { ... }
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
