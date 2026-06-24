import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Search, Users, Shield, UserCheck, UserX, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminGetUsers, adminToggleUserStatus, type ApiAdminUser } from '@/services/adminApi';
import { formatDateTime } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';

const ROLE_META: Record<string, { label: string; color: string }> = {
  CUSTOMER: { label: 'Customer', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  ADMIN: { label: 'Admin', color: 'bg-purple-50 text-purple-600 border-purple-100' },
  STAFF: { label: 'Staff', color: 'bg-orange-50 text-orange-600 border-orange-100' },
};

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ApiAdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CUSTOMER' | 'ADMIN' | 'STAFF'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const { data } = await adminGetUsers();
        if (!cancelled) setUsers(data);
      } catch {
        if (!cancelled) toast.error('Could not load users');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (kw) {
        return (
          u.fullName.toLowerCase().includes(kw) ||
          u.email.toLowerCase().includes(kw) ||
          (u.phone || '').includes(kw)
        );
      }
      return true;
    });
  }, [users, search, roleFilter]);

  const handleToggleStatus = async (user: ApiAdminUser) => {
    setActiveId(user.id);
    try {
      const { data } = await adminToggleUserStatus(user.id);
      setUsers((cur) => cur.map((u) => (u.id === user.id ? data : u)));
      toast.success(`${data.isActive ? 'Activated' : 'Deactivated'} account ${data.fullName}`);
    } catch {
      toast.error('Could not update user status');
    } finally {
      setActiveId(null);
    }
  };

  const summary = {
    total: users.length,
    customers: users.filter((u) => u.role === 'CUSTOMER').length,
    staff: users.filter((u) => u.role === 'STAFF' || u.role === 'ADMIN').length,
    active: users.filter((u) => u.isActive).length,
  };

  return (
    <AdminLayout title="User Management">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: summary.total, icon: Users, color: 'text-blue-600' },
          { label: 'Customer', value: summary.customers, icon: UserCheck, color: 'text-green-600' },
          { label: 'Staff / Admin', value: summary.staff, icon: Shield, color: 'text-purple-600' },
          { label: 'Active', value: summary.active, icon: UserCheck, color: 'text-[#78ad44]' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <s.icon size={20} className={`mb-3 ${s.color}`} />
            <p className="text-2xl font-black text-gray-900">{s.value}</p>
            <p className="text-xs font-bold text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#78ad44]/20 focus:border-[#78ad44]"
          />
        </div>
        <div className="flex bg-[#f4f8f7] p-1 rounded-xl">
          {(['ALL', 'CUSTOMER', 'STAFF', 'ADMIN'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                roleFilter === r ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {r === 'ALL' ? 'All' : ROLE_META[r]?.label ?? r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#f4f8f7] border-b border-gray-100">
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Users</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Contact</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Role</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Created Date</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Status</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="p-10 text-center">
                    <Loader2 className="animate-spin mx-auto text-[#78ad44]" size={28} />
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-400 font-bold">
                    No matching users found
                  </td>
                </tr>
              )}
              {!isLoading && filtered.map((user) => {
                const roleMeta = ROLE_META[user.role] ?? { label: user.role, color: 'bg-gray-50 text-gray-600 border-gray-100' };
                const busy = activeId === user.id;
                const isCurrentUser = Number(currentUser?.id) === user.id;
                return (
                  <tr key={user.id} className="hover:bg-gray-50/60 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#f4f8f7] flex items-center justify-center text-[#78ad44] font-black text-sm shrink-0">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-sm">{user.fullName}</p>
                          <p className="text-xs font-bold text-gray-400">#{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="text-sm font-bold text-gray-900">{user.email}</p>
                      <p className="text-xs font-bold text-gray-400">{user.phone || '—'}</p>
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${roleMeta.color}`}>
                        {roleMeta.label}
                      </span>
                    </td>
                    <td className="p-5 text-sm font-bold text-gray-500">{formatDateTime(user.createdAt)}</td>
                    <td className="p-5">
                      <span className={`px-3 py-1.5 text-xs font-bold rounded-lg ${user.isActive ? 'bg-[#e9f2eb] text-[#78ad44]' : 'bg-red-50 text-red-500'}`}>
                        {user.isActive ? 'Active' : 'Locked'}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <button
                        disabled={busy || isCurrentUser}
                        onClick={() => handleToggleStatus(user)}
                        title={isCurrentUser ? 'Cannot lock the currently signed-in account' : undefined}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ${
                          user.isActive
                            ? 'bg-red-50 text-red-500 hover:bg-red-100'
                            : 'bg-[#e9f2eb] text-[#78ad44] hover:bg-[#d5eac6]'
                        }`}
                      >
                        {busy ? <Loader2 size={14} className="animate-spin" /> : user.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                        {isCurrentUser ? 'Current account' : user.isActive ? 'Lock' : 'Unlock'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-5 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-400">Showing {filtered.length} / {users.length} users</p>
        </div>
      </div>
    </AdminLayout>
  );
}
