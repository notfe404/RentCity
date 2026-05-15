import { useState, useRef, useEffect } from 'react';
import { Menu, X, User, LayoutDashboard, FileText, LogOut, Car, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Home',      href: '/' },
  { label: 'Services',  href: '#services' },
  { label: 'Fleet',     href: '/search' },
  { label: 'Community', href: '#community' },
];

function UserDropdown() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN' || user.role === 'STAFF';

  const links = isAdmin
    ? [
        { label: 'Admin Dashboard', icon: LayoutDashboard, path: '/admin' },
        { label: 'Vehicles', icon: Car, path: '/admin/vehicles' },
        { label: 'Bookings', icon: FileText, path: '/admin/bookings' },
      ]
    : [
        { label: 'My Profile', icon: User, path: '/profile' },
        { label: 'My Bookings', icon: FileText, path: '/my-bookings' },
      ];

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2.5 bg-white border border-gray-100 hover:border-[#78ad44] rounded-full pr-4 pl-1 py-1 transition-all shadow-sm group"
      >
        <img 
          src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=78ad44&color=fff`}
          alt={user.fullName}
          className="w-8 h-8 rounded-full object-cover"
        />
        <span className="text-sm font-bold text-gray-700 group-hover:text-[#78ad44] max-w-[100px] truncate">
          {user.fullName.split(' ')[0]}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-100 bg-[#f4f8f7]">
            <p className="font-black text-gray-900 text-sm">{user.fullName}</p>
            <p className="text-xs text-gray-500 font-medium">{user.email}</p>
            <span className={`inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
              user.role === 'ADMIN' ? 'bg-gray-900 text-white' :
              user.role === 'STAFF' ? 'bg-blue-100 text-blue-700' :
              'bg-[#e9f2eb] text-[#78ad44]'
            }`}>{user.role}</span>
          </div>

          {/* Navigation links */}
          <div className="py-2">
            {links.map(link => (
              <button
                key={link.path}
                onClick={() => { navigate(link.path); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-[#f4f8f7] hover:text-[#78ad44] transition-colors"
              >
                <link.icon size={16} /> {link.label}
              </button>
            ))}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 py-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const { openAuthModal, isLoggedIn } = useAuth();

  return (
    <header className="fixed top-0 w-full z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <a href="/" className="flex items-center">
            <img src="/logo.png" alt="Rent City Logo" className="h-10 md:h-12 w-auto object-contain hover:scale-105 transition-transform" />
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} className="text-sm font-medium text-muted hover:text-brand transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          {/* Actions — Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <UserDropdown />
            ) : (
              <button 
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-2 bg-[#78ad44] hover:bg-[#689938] text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors shadow-sm"
              >
                <User size={16} /> Sign In
              </button>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setOpen(o => !o)} className="md:hidden p-2 text-muted hover:text-brand">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-border px-4 pb-4 pt-2 space-y-1 shadow-lg absolute w-full left-0">
          {NAV_LINKS.map(l => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-muted hover:text-brand">
              {l.label}
            </a>
          ))}
          <div className="pt-3">
            {!isLoggedIn && (
              <button 
                onClick={() => { setOpen(false); openAuthModal('login'); }}
                className="w-full flex items-center justify-center gap-2 bg-[#78ad44] text-white font-bold text-sm py-2.5 rounded-xl"
              >
                <User size={18} /> Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
