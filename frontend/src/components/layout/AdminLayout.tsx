import { 
  LayoutDashboard, 
  Car, 
  ListOrdered, 
  Users, 
  Settings, 
  LogOut,
  Bell
} from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Vehicles', path: '/admin/vehicles', icon: Car },
    { name: 'Bookings', path: '/admin/bookings', icon: ListOrdered },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f4f8f7] flex font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-full z-10 transition-transform">
        <div className="h-20 flex items-center justify-center border-b border-gray-100 px-6">
          <Link to="/" className="flex items-center gap-2 font-black text-2xl tracking-tighter text-gray-900 group">
            <div className="bg-[#212529] p-1.5 rounded-lg group-hover:bg-[#78ad44] transition-colors"><Car size={20} className="text-white"/></div>
            Rent<span className="text-[#78ad44]">City</span>
            <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full relative -top-3 -left-1">PRO</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {links.map(link => {
            const isActive = location.pathname === link.path || (link.path !== '/admin' && location.pathname.startsWith(link.path));
            return (
              <button
                key={link.name}
                onClick={() => navigate(link.path)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all text-sm ${isActive ? 'bg-[#78ad44] text-white shadow-md shadow-[#78ad44]/20' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                <link.icon size={18} /> {link.name}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all text-sm">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen">
        
        {/* Topbar */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10">
          <h1 className="text-2xl font-black text-gray-900">{title}</h1>
          <div className="flex items-center gap-6">
            <button className="relative text-gray-400 hover:text-[#78ad44] transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 border-l border-gray-200 pl-6 cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">Admin User</p>
                <p className="text-xs font-medium text-gray-400">Superadmin</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
                <img src="https://ui-avatars.com/api/?name=Admin&background=212529&color=fff" alt="admin" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 flex-1">
          {children}
        </div>
        
      </main>
      
    </div>
  );
}
