import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Plus, Edit, Trash2, Tag, Loader2, X, Check, Search } from 'lucide-react';
import { toast } from 'sonner';
import { getCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory, type ApiCategory } from '@/services/adminApi';
import { formatVND } from '@/utils/formatters';

interface CategoryFormData {
  name: string;
  description: string;
  seats: number;
  basePriceDay: number;
  depositRate: number;
  isActive: boolean;
}

const EMPTY_FORM: CategoryFormData = { name: '', description: '', seats: 4, basePriceDay: 0, depositRate: 0.3, isActive: true };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiCategory | null>(null);
  const [form, setForm] = useState<CategoryFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const { data } = await getCategories();
        if (!cancelled) setCategories(data);
      } catch {
        if (!cancelled) toast.error('Could not load vehicle categories');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (c: ApiCategory) => {
    setEditing(c);
    setForm({
      name: c.name,
      description: c.description || '',
      seats: c.seats || 4,
      basePriceDay: c.basePriceDay,
      depositRate: c.depositRate,
      isActive: c.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }
    setIsSaving(true);
    try {
      if (editing) {
        const { data } = await adminUpdateCategory(editing.id, form);
        setCategories((cur) => cur.map((c) => (c.id === editing.id ? data : c)));
        toast.success('Category updated');
      } else {
        const { data } = await adminCreateCategory(form);
        setCategories((cur) => [data, ...cur]);
        toast.success('Category created');
      }
      setIsModalOpen(false);
    } catch {
      toast.error('Could not save category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (cat: ApiCategory) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    setDeletingId(cat.id);
    try {
      await adminDeleteCategory(cat.id);
      setCategories((cur) => cur.filter((c) => c.id !== cat.id));
      toast.success('Category deleted');
    } catch {
      toast.error('Could not delete category');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout title="Vehicle Categories">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#78ad44]/20 focus:border-[#78ad44]"
          />
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#78ad44] hover:bg-[#689938] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md"
        >
          <Plus size={18} /> Add Category
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[#78ad44]" />
        </div>
      ) : (
        <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#f4f8f7] border-b border-gray-100">
                  <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Seats</th>
                  <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Base Price / day</th>
                  <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Deposit Rate</th>
                  <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-400 font-bold">
                      <Tag className="mx-auto mb-3 text-gray-300" size={36} />
                      No categories found
                    </td>
                  </tr>
                )}
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#f4f8f7] flex items-center justify-center text-[#78ad44] shrink-0">
                          <Tag size={16} />
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-sm">{c.name}</p>
                          <p className="text-xs font-bold text-gray-400 truncate max-w-xs">{c.description || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 font-bold text-gray-700 text-sm">{c.seats} seats</td>
                    <td className="p-5 font-black text-gray-900 text-sm">{formatVND(c.basePriceDay)}</td>
                    <td className="p-5 font-bold text-gray-700 text-sm">{(c.depositRate * 100).toFixed(0)}%</td>
                    <td className="p-5">
                      <span className={`px-3 py-1.5 text-xs font-bold rounded-lg ${c.isActive ? 'bg-[#e9f2eb] text-[#78ad44]' : 'bg-gray-100 text-gray-400'}`}>
                        {c.isActive ? 'In Use' : 'Hidden'}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          disabled={deletingId === c.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === c.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-5 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-400">Total: {filtered.length} categories</p>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">{editing ? 'Edit Category' : 'Add New Category'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-700 rounded-xl">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Category Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="VD: Sedan, SUV, Luxury..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#78ad44] focus:ring-2 focus:ring-[#78ad44]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Short category description..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#78ad44] focus:ring-2 focus:ring-[#78ad44]/20 resize-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Seats *</label>
                  <input
                    type="number"
                    min={1}
                    value={form.seats}
                    onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#78ad44] focus:ring-2 focus:ring-[#78ad44]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Price / day</label>
                  <input
                    type="number"
                    min={0}
                    value={form.basePriceDay}
                    onChange={(e) => setForm({ ...form, basePriceDay: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#78ad44] focus:ring-2 focus:ring-[#78ad44]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Deposit Rate (0.1 - 1.0)</label>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={form.depositRate}
                    onChange={(e) => setForm({ ...form, depositRate: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#78ad44] focus:ring-2 focus:ring-[#78ad44]/20"
                  />
                </div>
              </div>
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
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3 bg-[#78ad44] hover:bg-[#689938] text-white font-bold rounded-xl transition-colors shadow-md disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
