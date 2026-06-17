import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { ApiCarResponse } from '@/types';
import type { AdminCarPayload } from '@/services/carApi';
import type { ApiBranch, ApiCategory } from '@/services/adminApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: AdminCarPayload, conditionFiles: File[]) => Promise<void>;
  initialData: ApiCarResponse | null;
  branches: ApiBranch[];
  categories: ApiCategory[];
}

const EMPTY: AdminCarPayload = {
  brand: '',
  model: '',
  licensePlate: '',
  year: new Date().getFullYear(),
  transmission: 'AUTO',
  pricePerDay: 0,
  deposit: 0,
  status: 'AVAILABLE',
  description: '',
  categoryId: undefined,
  branchId: undefined,
  seats: 5,
  initialCondition: {
    condition: 'GOOD',
    odometer: 0,
    fuelLevel: 100,
    damageFound: false,
    notes: '',
  },
};

export default function VehicleFormModal({ isOpen, onClose, onSave, initialData, branches, categories }: Props) {
  const [form, setForm] = useState<AdminCarPayload>(EMPTY);
  const [isSaving, setIsSaving] = useState(false);
  const [conditionFiles, setConditionFiles] = useState<File[]>([]);

  useEffect(() => {
    if (initialData) {
      setForm({
        brand: initialData.brand,
        model: initialData.model,
        licensePlate: initialData.licensePlate,
        year: initialData.year ?? new Date().getFullYear(),
        transmission: initialData.transmission,
        pricePerDay: initialData.pricePerDay,
        deposit: initialData.deposit ?? 0,
        status: initialData.status,
        description: initialData.description ?? '',
        categoryId: initialData.categoryId ?? undefined,
        branchId: initialData.branchId ?? undefined,
        seats: initialData.seats ?? 5,
        initialCondition: initialData.currentCondition ? {
          condition: 'GOOD',
          odometer: initialData.currentCondition.odometer,
          fuelLevel: initialData.currentCondition.fuelLevel,
          damageFound: initialData.currentCondition.damageFound,
          notes: initialData.currentCondition.notes ?? '',
        } : EMPTY.initialCondition,
      });
    } else {
      setForm(EMPTY);
    }
    setConditionFiles([]);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brand.trim() || !form.model.trim() || !form.licensePlate.trim()) {
      return;
    }
    setIsSaving(true);
    try {
      await onSave(form, conditionFiles);
    } finally {
      setIsSaving(false);
    }
  };

  const field = (label: string, key: keyof AdminCarPayload, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-1.5">{label}</label>
      <input
        type={type}
        value={(form[key] ?? '') as string | number}
        onChange={(e) => setForm({ ...form, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#78ad44] focus:ring-2 focus:ring-[#78ad44]/20"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-[#f8f9fa] shrink-0 rounded-t-2xl">
          <h2 className="font-black text-gray-900 text-lg">{initialData ? 'Sửa thông tin xe' : 'Thêm xe mới'}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form id="car-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {field('Hãng xe *', 'brand', 'text', 'Toyota, Honda, BMW...')}
            {field('Dòng xe *', 'model', 'text', 'Camry, CR-V, X5...')}
            {field('Biển số *', 'licensePlate', 'text', '30A-12345')}
            {field('Năm sản xuất', 'year', 'number', '2024')}
            {field('Số chỗ', 'seats', 'number', '5')}
            {field('Giá / ngày (VND) *', 'pricePerDay', 'number', '500000')}
            {field('Tiền cọc (VND)', 'deposit', 'number', '0')}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Hộp số</label>
              <select
                value={form.transmission}
                onChange={(e) => setForm({ ...form, transmission: e.target.value as 'AUTO' | 'MANUAL' })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#78ad44] appearance-none"
              >
                <option value="AUTO">Số tự động</option>
                <option value="MANUAL">Số sàn</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Trạng thái</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as AdminCarPayload['status'] })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#78ad44] appearance-none"
              >
                <option value="AVAILABLE">Sẵn sàng</option>
                <option value="MAINTENANCE">Bảo dưỡng</option>
                <option value="RETIRED">Ngừng dùng</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Danh mục</label>
              <select
                value={form.categoryId ?? ''}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#78ad44] appearance-none"
              >
                <option value="">— Không chọn —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Chi nhánh</label>
              <select
                value={form.branchId ?? ''}
                onChange={(e) => setForm({ ...form, branchId: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#78ad44] appearance-none"
              >
                <option value="">— Không chọn —</option>
                {branches.filter((b) => b.isActive).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Mô tả ngắn về xe..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#78ad44] focus:ring-2 focus:ring-[#78ad44]/20 resize-none"
            />
          </div>
          {!initialData && (
            <div className="border border-gray-200 rounded-2xl p-5 space-y-4 bg-[#f8f9fa]">
              <div>
                <h3 className="font-black text-gray-900">Initial car condition</h3>
                <p className="text-xs text-gray-500 mt-1">Condition is recorded as GOOD. Add the measurable details below.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Odometer (km) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.initialCondition?.odometer ?? 0}
                    onChange={(e) => setForm({
                      ...form,
                      initialCondition: { ...form.initialCondition!, odometer: Number(e.target.value) },
                    })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#78ad44]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Fuel level (%) *</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={form.initialCondition?.fuelLevel ?? 100}
                    onChange={(e) => setForm({
                      ...form,
                      initialCondition: { ...form.initialCondition!, fuelLevel: Number(e.target.value) },
                    })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#78ad44]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={form.initialCondition?.damageFound ?? false}
                  onChange={(e) => setForm({
                    ...form,
                    initialCondition: { ...form.initialCondition!, damageFound: e.target.checked },
                  })}
                  className="w-4 h-4 accent-[#78ad44]"
                />
                Existing damage found
              </label>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Condition notes</label>
                <textarea
                  rows={3}
                  value={form.initialCondition?.notes ?? ''}
                  onChange={(e) => setForm({
                    ...form,
                    initialCondition: { ...form.initialCondition!, notes: e.target.value },
                  })}
                  placeholder="Existing scratches, interior condition, accessories..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#78ad44] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Condition photos</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setConditionFiles(Array.from(e.target.files ?? []))}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#e9f2eb] file:px-4 file:py-2 file:font-bold file:text-[#78ad44]"
                />
                {conditionFiles.length > 0 && (
                  <p className="text-xs font-bold text-gray-500 mt-2">{conditionFiles.length} photo(s) selected</p>
                )}
              </div>
            </div>
          )}
        </form>

        <div className="p-5 border-t border-gray-100 flex gap-3 shrink-0 bg-white rounded-b-2xl">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">
            Hủy
          </button>
          <button
            type="submit"
            form="car-form"
            disabled={isSaving}
            className="flex-1 py-3 bg-[#78ad44] hover:bg-[#689938] text-white font-bold rounded-xl transition-colors shadow-md disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
            {initialData ? 'Lưu thay đổi' : 'Thêm xe'}
          </button>
        </div>
      </div>
    </div>
  );
}
