import {
  LayoutDashboard,
  Car,
  ListOrdered,
  Users,
  CreditCard,
  MapPin,
  Tag,
  LogOut,
  Bell,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AdminNotificationBell from './AdminNotificationBell';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const NAV_LINKS = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
  { name: 'Quản lý xe', path: '/admin/vehicles', icon: Car },
  { name: 'Booking', path: '/admin/bookings', icon: ListOrdered },
  { name: 'Reviews', path: '/admin/reviews', icon: MessageSquare },
  { name: 'Thông báo', path: '/admin/notifications', icon: Bell },
  { name: 'Thanh toán', path: '/admin/payments', icon: CreditCard },
  { name: 'Người dùng', path: '/admin/users', icon: Users },
  { name: 'Chi nhánh', path: '/admin/branches', icon: MapPin },
  { name: 'Danh mục xe', path: '/admin/categories', icon: Tag },
];

function isLinkActive(path: string, currentPath: string, exact = false) {
  if (exact) return currentPath === path;
  return currentPath === path || currentPath.startsWith(path + '/');
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="h-20 flex items-center justify-between border-b border-gray-100 px-6 shrink-0">
        <Link to="/" className="flex items-center gap-2 font-black text-xl tracking-tighter text-gray-900 group">
          <div className="bg-[#212529] p-1.5 rounded-lg group-hover:bg-[#78ad44] transition-colors">
            <Car size={18} className="text-white" />
          </div>
          Rent<span className="text-[#78ad44]">City</span>
          <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full relative -top-3 -left-1">ADMIN</span>
        </Link>
        <button className="lg:hidden p-2 text-gray-400 hover:text-gray-700" onClick={() => setSidebarOpen(false)}>
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {NAV_LINKS.map((link) => {
          const active = isLinkActive(link.path, location.pathname, link.exact);
          return (
            <button
              key={link.path}
              onClick={() => { navigate(link.path); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all text-sm ${
                active
                  ? 'bg-[#78ad44] text-white shadow-md shadow-[#78ad44]/20'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <link.icon size={18} /> {link.name}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all text-sm"
        >
          <LogOut size={18} /> Đăng xuất
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f4f8f7] flex font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop fixed, mobile slide-in */}
      <aside
        className={`w-64 bg-white border-r border-gray-100 flex flex-col fixed h-full z-30 transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <SidebarContent />
      </aside>

      {/* Main */}
      <main className="lg:ml-64 flex-1 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-5 lg:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-black text-gray-900">{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <AdminNotificationBell />
            <div className="flex items-center gap-3 border-l border-gray-200 pl-4 cursor-pointer">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-gray-900">{user?.fullName ?? 'Admin'}</p>
                <p className="text-xs font-medium text-gray-400 capitalize">{user?.role ?? 'Admin'}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#212529] overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-white font-bold text-sm">
                {(user?.fullName ?? 'A').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-5 lg:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
