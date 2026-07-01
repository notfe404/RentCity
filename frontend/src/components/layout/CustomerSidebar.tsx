import { User, FileText, Bell, LogOut, Camera, CreditCard } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useRef, useState } from 'react';
import { getUnreadNotificationCount } from '@/services/notificationApi';

export default function CustomerSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadUnreadCount = async () => {
      try {
        const { data } = await getUnreadNotificationCount();
        if (!cancelled) setUnreadNotifications(data.count);
      } catch {
        if (!cancelled) setUnreadNotifications(0);
      }
    };

    loadUnreadCount();
    const timer = window.setInterval(loadUnreadCount, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const links = [
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'My bookings', path: '/my-bookings', icon: FileText },
    { name: 'Payment', path: '/payments', icon: CreditCard },
    { name: 'Notifications', path: '/notifications', icon: Bell },
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      updateUser({ avatarUrl: URL.createObjectURL(file) });
    }
  };

  return (
    <aside className="w-full lg:w-72 shrink-0 bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 h-fit">
      <div className="flex flex-col items-center mb-8 pt-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="relative mb-4 group">
          <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-md">
            <img
              src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=78ad44&color=fff&size=100`}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="text-white" size={24} />
          </div>
        </button>
        <h3 className="text-lg font-black text-gray-900">{user?.fullName || 'Customer'}</h3>
        <p className="text-sm text-gray-500 font-medium capitalize">{user?.role?.toLowerCase()}</p>
      </div>

      <nav className="space-y-2">
        {links.map((link) => {
          const active = location.pathname === link.path
            || (link.path !== '/profile' && location.pathname.startsWith(link.path));
          return (
            <button
              key={link.path}
              type="button"
              onClick={() => navigate(link.path)}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl font-bold transition-all ${
                active
                  ? 'bg-[#78ad44] text-white shadow-md shadow-[#78ad44]/20'
                  : 'text-gray-600 hover:bg-[#f4f8f7] hover:text-[#78ad44]'
              }`}
            >
              <link.icon size={18} /> {link.name}
              {link.path === '/notifications' && unreadNotifications > 0 && (
                <span className={`ml-auto min-w-5 h-5 px-1.5 rounded-full text-[11px] font-black flex items-center justify-center ${
                  active ? 'bg-white text-[#78ad44]' : 'bg-red-500 text-white'
                }`}>
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </button>
          );
        })}
        <div className="pt-6 mt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </nav>
    </aside>
  );
}
