import { createContext, useState, useEffect, type ReactNode } from 'react';
import type { User, AuthResponse, LoginRequest, RegisterRequest } from '@/types';
import api from '@/services/api';
import { MOCK_USERS } from '@/data/mockUsers';

// ============================================================
// Auth Context — B2C (CUSTOMER | STAFF | ADMIN)
// ============================================================

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // State quản lý Popup Đăng nhập/Đăng ký
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'login' | 'register'>('login');

  // Khôi phục session khi tải trang
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setIsLoading(false); return; }

    // Nếu là mock token — restore từ localStorage không cần gọi API
    if (token.startsWith('mock-token-')) {
      const saved = localStorage.getItem('mockUser');
      if (saved) setUser(JSON.parse(saved));
      setIsLoading(false);
      return;
    }

    // Token thật — gọi API
    api.get<User>('/auth/me')
      .then(({ data }) => setUser(data))
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (credentials: LoginRequest) => {
    // ── MOCK LOGIN (for local development) ──────────────────
    const mockUser = MOCK_USERS[credentials.email];
    if (mockUser && mockUser.password === credentials.password) {
      const { password: _, ...user } = mockUser;
      localStorage.setItem('accessToken', 'mock-token-' + user.role);
      localStorage.setItem('mockUser', JSON.stringify(user));
      setUser(user);
      closeAuthModal();
      return;
    }
    // ── REAL API ─────────────────────────────────────────────
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    closeAuthModal();
  };

  const register = async (info: RegisterRequest) => {
    // ── MOCK REGISTER (for local development) ────────────────
    const newUser: User = {
      id: 'u-' + Math.random().toString(36).substr(2, 9),
      email: info.email,
      fullName: info.fullName || 'New User',
      phone: info.phone || '',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      loyaltyPoints: 0,
      tier: 'STANDARD',
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(info.fullName || 'New User')}&background=random&color=fff`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('accessToken', 'mock-token-CUSTOMER');
    localStorage.setItem('mockUser', JSON.stringify(newUser));
    setUser(newUser);
    closeAuthModal();
    return;
    // ── REAL API ─────────────────────────────────────────────
    // const { data } = await api.post<AuthResponse>('/auth/register', info);
    // localStorage.setItem('accessToken', data.accessToken);
    // localStorage.setItem('refreshToken', data.refreshToken);
    // setUser(data.user);
    // closeAuthModal();
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('mockUser', JSON.stringify(updatedUser));
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

// Hook internal — dùng bởi useAuth.ts
export { AuthContext };
