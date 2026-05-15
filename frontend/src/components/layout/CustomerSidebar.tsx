import { User, FileText, Bell, Settings, LogOut, Camera } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRef } from 'react';
import { MOCK_NOTIFICATIONS } from '@/data/mockNotifications';

export default function CustomerSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.isRead).length;

  const links = [
    { name: 'Hồ sơ', path: '/profile', icon: User },
    { name: 'Đơn đặt xe', path: '/my-bookings', icon: FileText },
    { name: 'Thông báo', path: '/notifications', icon: Bell, badge: unreadCount },
    { name: 'Cài đặt', path: '/settings', icon: Settings },
  ];

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateUser({ avatarUrl: url });
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
        <div 
          onClick={handleAvatarClick}
          className="relative mb-4 group cursor-pointer"
        >
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
        </div>
        <h3 className="text-lg font-black text-gray-900">{user?.fullName || 'Khách'}</h3>
        <p className="text-sm text-gray-500 font-medium capitalize">{user?.role === 'CUSTOMER' ? 'Khách hàng' : user?.role === 'STAFF' ? 'Nhân viên' : user?.role === 'ADMIN' ? 'Quản trị' : 'Khách'}</p>
      </div>

      <nav className="space-y-2">
        {links.map(link => {
          const isActive = location.pathname === link.path || (link.path !== '/profile' && location.pathname.startsWith(link.path));
          return (
            <button 
              key={link.name}
              onClick={() => navigate(link.path)}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl font-bold transition-all relative ${isActive ? 'bg-[#78ad44] text-white shadow-md shadow-[#78ad44]/20' : 'text-gray-600 hover:bg-[#f4f8f7] hover:text-[#78ad44]'}`}
            >
              <link.icon size={18} /> {link.name}
              {'badge' in link && link.badge! > 0 && (
                <span className={`ml-auto text-xs font-black rounded-full w-5 h-5 flex items-center justify-center ${isActive ? 'bg-white text-[#78ad44]' : 'bg-red-500 text-white'}`}>
                  {link.badge}
                </span>
              )}
            </button>
          );
        })}
        <div className="pt-6 mt-6 border-t border-gray-100">
          <button 
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </nav>
    </aside>
  );
}
