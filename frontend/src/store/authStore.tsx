import { createContext, useState, useEffect, type ReactNode } from 'react';
import type { User, AuthResponse, LoginRequest, RegisterRequest, ApiUser } from '@/types';
import api from '@/services/api';
import { mapApiUserToUser } from '@/utils/userMapper';

interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  isAuthModalOpen: boolean;
  authModalInitialTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function clearStoredSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('mockUser');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    api.get<ApiUser>('/users/me')
      .then(({ data }) => setUser(mapApiUserToUser(data)))
      .catch(() => {
        clearStoredSession();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (credentials: LoginRequest) => {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(mapApiUserToUser(data.user));
    closeAuthModal();
  };

  const register = async (info: RegisterRequest) => {
    const { data } = await api.post<AuthResponse>('/auth/register', info);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(mapApiUserToUser(data.user));
    closeAuthModal();
  };

  const logout = async () => {
    try {
      if (localStorage.getItem('accessToken')) {
        await api.post('/auth/logout');
      }
    } finally {
      clearStoredSession();
      setUser(null);
    }
  };

  const updateUser = (data: Partial<User>) => {
    setUser((currentUser) => currentUser ? { ...currentUser, ...data } : currentUser);
  };

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalInitialTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn: !!user,
      isLoading,
      login,
      register,
      logout,
      updateUser,
      isAuthModalOpen,
      authModalInitialTab,
      openAuthModal,
      closeAuthModal
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };

