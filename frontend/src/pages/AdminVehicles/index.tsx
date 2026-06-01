import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Plus, Search, Edit, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { searchCars, adminCreateCar, adminUpdateCar, adminDeleteCar, type AdminCarPayload } from '@/services/carApi';
import { getBranches, getCategories, type ApiBranch, type ApiCategory } from '@/services/adminApi';
import { formatVND } from '@/utils/formatters';
import type { ApiCarResponse } from '@/types';
import VehicleFormModal from './VehicleFormModal';

const STATUS_META: Record<string, { label: string; color: string }> = {
  AVAILABLE:   { label: 'Sẵn sàng',  color: 'bg-[#e9f2eb] text-[#78ad44]' },
  RENTED:      { label: 'Đang thuê', color: 'bg-blue-50 text-blue-600' },
  MAINTENANCE: { label: 'Bảo dưỡng', color: 'bg-orange-50 text-orange-600' },
  RETIRED:     { label: 'Ngừng dùng', color: 'bg-gray-100 text-gray-400' },
};

export default function AdminVehiclesPage() {
  const [cars, setCars] = useState<ApiCarResponse[]>([]);
  const [branches, setBranches] = useState<ApiBranch[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<ApiCarResponse | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const [carsRes, branchesRes, categoriesRes] = await Promise.all([
          searchCars({ size: 100 }),
          getBranches(),
          getCategories(),
        ]);
        if (!cancelled) {
          setCars(carsRes.data.content);
          setBranches(branchesRes.data);
          setCategories(categoriesRes.data);
          setLoadError(false);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return cars;
    return cars.filter(
      (c) =>
        `${c.brand} ${c.model}`.toLowerCase().includes(kw) ||
        c.licensePlate.toLowerCase().includes(kw) ||
        (c.categoryName || '').toLowerCase().includes(kw),
    );
  }, [cars, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openAdd = () => {
    setEditingCar(null);
    setIsModalOpen(true);
  };

  const openEdit = (car: ApiCarResponse) => {
    setEditingCar(car);
    setIsModalOpen(true);
  };

  const handleSave = async (payload: AdminCarPayload) => {
    try {
      if (editingCar) {
        const { data } = await adminUpdateCar(editingCar.id, payload);
        setCars((cur) => cur.map((c) => (c.id === editingCar.id ? data : c)));
        toast.success('Đã cập nhật xe');
      } else {
        const { data } = await adminCreateCar(payload);
        setCars((cur) => [data, ...cur]);
        toast.success('Đã thêm xe mới');
        setCurrentPage(1);
      }
      setIsModalOpen(false);
    } catch (error) {
      const msg = (error as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Không thể lưu xe';
      toast.error(msg);
      throw error;
    }
  };

  const handleDelete = async (car: ApiCarResponse) => {
    if (!window.confirm(`Xóa xe "${car.brand} ${car.model}" (${car.licensePlate})?`)) return;
    setDeletingId(car.id);
    try {
      await adminDeleteCar(car.id);
      setCars((cur) => cur.filter((c) => c.id !== car.id));
      toast.success('Đã xóa xe');
    } catch {
      toast.error('Không thể xóa xe (có thể đang có booking)');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout title="Quản lý xe">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm theo tên, biển số, danh mục..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#78ad44]/20 focus:border-[#78ad44]"
          />
        </div>
        <button
          onClick={openAdd}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#78ad44] hover:bg-[#689938] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md"
        >
          <Plus size={18} /> Thêm xe mới
        </button>
      </div>

      {/* Error */}
      {loadError && (
        <div className="bg-white rounded-2xl border border-red-100 p-6 text-red-500 font-bold flex items-center gap-3 mb-6">
          <AlertCircle size={20} />
          Không tải được dữ liệu. Backend có thể chưa chạy — hiện tại không có xe nào.
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[320px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f4f8f7] border-b border-gray-100">
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Xe</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Danh mục</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Giá / ngày</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Chi nhánh</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Trạng thái</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-[#78ad44]" size={28} />
                  </td>
                </tr>
              )}
              {!isLoading && paged.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-400 font-bold">
                    {search ? `Không tìm thấy xe nào với "${search}"` : 'Chưa có xe nào'}
                  </td>
                </tr>
              )}
              {!isLoading && paged.map((car) => {
                const statusMeta = STATUS_META[car.status] ?? { label: car.status, color: 'bg-gray-100 text-gray-500' };
                const busy = deletingId === car.id;
                return (
                  <tr key={car.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        {car.primaryImageUrl ? (
                          <img src={car.primaryImageUrl} alt={car.brand} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0 flex items-center justify-center text-gray-400 font-bold text-xs">
                            {car.brand.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-black text-gray-900 text-sm group-hover:text-[#78ad44] transition-colors">
                            {car.brand} {car.model}
                          </p>
                          <p className="text-xs font-bold text-gray-400">{car.licensePlate}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="bg-[#f4f8f7] text-gray-600 px-3 py-1 text-xs font-bold rounded-lg border border-gray-200">
                        {car.categoryName || '—'}
                      </span>
                    </td>
                    <td className="p-5 font-black text-gray-900 text-sm">{formatVND(car.pricePerDay)}</td>
                    <td className="p-5 text-sm font-bold text-gray-600">{car.branchName || '—'}</td>
                    <td className="p-5">
                      <span className={`px-3 py-1.5 text-xs font-bold rounded-lg ${statusMeta.color}`}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(car)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          title="Sửa"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(car)}
                          disabled={busy}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                          title="Xóa"
                        >
                          {busy ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-[#f8f9fa]/50">
          <p className="text-xs font-black text-gray-500">
            Hiển thị <span className="text-gray-900">{Math.min((currentPage - 1) * pageSize + 1, filtered.length)}</span>–
            <span className="text-gray-900">{Math.min(currentPage * pageSize, filtered.length)}</span> /
            <span className="text-gray-900"> {filtered.length}</span> xe
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              >
                Trước
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    currentPage === i + 1 ? 'bg-[#78ad44] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <VehicleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingCar}
        branches={branches}
        categories={categories}
      />
    </AdminLayout>
  );
}
