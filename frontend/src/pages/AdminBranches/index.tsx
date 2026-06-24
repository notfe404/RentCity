import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Plus, Search, Edit, Trash2, MapPin, Loader2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getBranches, adminCreateBranch, adminUpdateBranch, adminDeleteBranch, type ApiBranch } from '@/services/adminApi';

interface BranchFormData {
  name: string;
  address: string;
  city: string;
  phone: string;
  isActive: boolean;
}

const EMPTY_FORM: BranchFormData = { name: '', address: '', city: '', phone: '', isActive: true };

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState<ApiBranch[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<ApiBranch | null>(null);
  const [form, setForm] = useState<BranchFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const { data } = await getBranches();
        if (!cancelled) setBranches(data);
      } catch {
        if (!cancelled) toast.error('Could not load branches');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  const filtered = branches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.address.toLowerCase().includes(search.toLowerCase()) ||
    b.city.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditingBranch(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (b: ApiBranch) => {
    setEditingBranch(b);
    setForm({ name: b.name, address: b.address, city: b.city, phone: b.phone || '', isActive: b.isActive });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.address.trim() || !form.city.trim()) {
      toast.error('Please fill in all required information');
      return;
    }
    setIsSaving(true);
    try {
      if (editingBranch) {
        const { data } = await adminUpdateBranch(editingBranch.id, form);
        setBranches((cur) => cur.map((b) => (b.id === editingBranch.id ? data : b)));
        toast.success('Branch updated');
      } else {
        const { data } = await adminCreateBranch(form);
        setBranches((cur) => [data, ...cur]);
        toast.success('Branch created');
      }
      setIsModalOpen(false);
    } catch {
      toast.error('Could not save branch');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (branch: ApiBranch) => {
    if (!window.confirm(`Delete branch "${branch.name}"?`)) return;
    setDeletingId(branch.id);
    try {
      await adminDeleteBranch(branch.id);
      setBranches((cur) => cur.filter((b) => b.id !== branch.id));
      toast.success('Branch deleted');
    } catch {
      toast.error('Could not delete branch');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout title="Branch Management">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search branches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#78ad44]/20 focus:border-[#78ad44]"
          />
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#78ad44] hover:bg-[#689938] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md"
        >
          <Plus size={18} /> Add Branch
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[#78ad44]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#f4f8f7] flex items-center justify-center text-[#78ad44] shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-gray-900 text-sm truncate">{b.name}</h3>
                    <p className="text-xs font-bold text-gray-400 truncate">{b.city}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-[10px] font-black rounded-full shrink-0 ${b.isActive ? 'bg-[#e9f2eb] text-[#78ad44]' : 'bg-gray-100 text-gray-400'}`}>
                  {b.isActive ? 'Active' : 'Paused'}
                </span>
              </div>
              <p className="text-sm text-gray-600 font-medium mb-3 line-clamp-2">{b.address}</p>
              {b.phone && <p className="text-xs font-bold text-gray-400 mb-4">{b.phone}</p>}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openEdit(b)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors"
                >
                  <Edit size={14} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(b)}
                  disabled={deletingId === b.id}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {deletingId === b.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Delete
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400 font-bold">
              <MapPin className="mx-auto mb-3 text-gray-300" size={36} />
              No branches found
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">{editingBranch ? 'Edit Branch' : 'Add New Branch'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-700 rounded-xl">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Branch Name *', key: 'name', placeholder: 'VD: Cau Giay Branch' },
                { label: 'Address *', key: 'address', placeholder: 'House number, street, district...' },
                { label: 'City *', key: 'city', placeholder: 'Hanoi, Ho Chi Minh City...' },
                { label: 'Phone Number', key: 'phone', placeholder: '0xxxxxxxxx' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">{f.label}</label>
                  <input
                    type="text"
                    value={form[f.key as keyof BranchFormData] as string}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#78ad44] focus:ring-2 focus:ring-[#78ad44]/20"
                  />
                </div>
              ))}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-[#78ad44]' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm font-bold text-gray-700">Active</span>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3 bg-[#78ad44] hover:bg-[#689938] text-white font-bold rounded-xl transition-colors shadow-md disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {editingBranch ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
