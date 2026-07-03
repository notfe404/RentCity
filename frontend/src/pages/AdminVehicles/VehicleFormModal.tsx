import { useEffect, useState } from 'react';
import { X, Loader2, Trash2, Star } from 'lucide-react';
import { deleteCarImage, setPrimaryCarImage } from '@/services/carApi';
import { toast } from 'sonner';
import type { ApiCarResponse } from '@/types';
import type { AdminCarPayload } from '@/services/carApi';
import type { ApiBranch, ApiCategory } from '@/services/adminApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: AdminCarPayload, conditionFiles: File[], carFiles: File[]) => Promise<void>;
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
  fuelType: 'GASOLINE',
  pricePerDay: 0,
  deposit: 5_000_000,
  status: 'AVAILABLE',
  description: '',
  categoryId: undefined,
  branchId: undefined,
  seats: 5,
  initialCondition: {
    condition: 'GOOD',
    damageFound: false,
    notes: '',
  },
};

export default function VehicleFormModal({ isOpen, onClose, onSave, initialData, branches, categories }: Props) {
  const [form, setForm] = useState<AdminCarPayload>(EMPTY);
  const [isSaving, setIsSaving] = useState(false);
  const [conditionFiles, setConditionFiles] = useState<File[]>([]);
  const [carFiles, setCarFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState(initialData?.images || []);

  useEffect(() => {
    if (initialData) {
      setForm({
        brand: initialData.brand,
        model: initialData.model,
        licensePlate: initialData.licensePlate,
        year: initialData.year ?? new Date().getFullYear(),
        transmission: initialData.transmission,
        fuelType: initialData.fuelType,
        pricePerDay: initialData.pricePerDay,
        deposit: initialData.deposit ?? 5_000_000,
        status: initialData.status,
        description: initialData.description ?? '',
        categoryId: initialData.categoryId ?? undefined,
        branchId: initialData.branchId ?? undefined,
        seats: initialData.seats ?? 5,
        initialCondition: initialData.currentCondition ? {
          condition: 'GOOD',
          damageFound: initialData.currentCondition.damageFound,
          notes: initialData.currentCondition.notes ?? '',
        } : EMPTY.initialCondition,
      });
    } else {
      setForm(EMPTY);
      setExistingImages([]);
    }
    if (initialData) {
      setExistingImages(initialData.images || []);
    }
    setConditionFiles([]);
    setCarFiles([]);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brand.trim() || !form.model.trim() || !form.licensePlate.trim() || !form.categoryId || !form.branchId
      || form.pricePerDay <= 0 || form.deposit <= 0) {
      toast.error('Complete all required fields and enter positive rental and security-deposit amounts');
      return;
    }
    setIsSaving(true);
    try {
      await onSave(form, conditionFiles, carFiles);
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
          <h2 className="font-black text-gray-900 text-lg">{initialData ? 'Edit Vehicle Information' : 'Add New Vehicle'}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form id="car-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {field('Brand *', 'brand', 'text', 'Toyota, Honda, BMW...')}
            {field('Model *', 'model', 'text', 'Camry, CR-V, X5...')}
            {field('License Plate *', 'licensePlate', 'text', '30A-12345')}
            {field('Year', 'year', 'number', '2024')}
            {field('Seats', 'seats', 'number', '5')}
            {field('Price / day (VND) *', 'pricePerDay', 'number', '500000')}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Security deposit (VND) *</label>
              <input
                type="number"
                min={1000}
                step={1000}
                required
                value={form.deposit}
                onChange={(event) => setForm({ ...form, deposit: Number(event.target.value) })}
                placeholder="5000000"
                className="w-full px-4 py-2.5 border border-amber-300 bg-amber-50 rounded-xl text-sm font-black text-amber-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              />
              <p className="mt-1.5 text-[11px] font-bold leading-4 text-amber-700">
                Required at handover and refunded after a good return.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Transmission</label>
              <select
                value={form.transmission}
                onChange={(e) => setForm({ ...form, transmission: e.target.value as 'AUTO' | 'MANUAL' })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#78ad44] appearance-none"
              >
                <option value="AUTO">Automatic</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Fuel</label>
              <select
                value={form.fuelType}
                onChange={(e) => setForm({ ...form, fuelType: e.target.value as AdminCarPayload['fuelType'] })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#78ad44] appearance-none"
              >
                <option value="GASOLINE">Gasoline</option>
                <option value="DIESEL">Diesel</option>
                <option value="ELECTRIC">Electric</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as AdminCarPayload['status'] })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#78ad44] appearance-none"
              >
                <option value="AVAILABLE">Available</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Category</label>
              <select
                value={form.categoryId ?? ''}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#78ad44] appearance-none"
              >
                <option value="">— None —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Branch</label>
              <select
                value={form.branchId ?? ''}
                onChange={(e) => setForm({ ...form, branchId: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#78ad44] appearance-none"
              >
                <option value="">— None —</option>
                {branches.filter((b) => b.isActive !== false).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Short vehicle description..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#78ad44] focus:ring-2 focus:ring-[#78ad44]/20 resize-none"
            />
          </div>

          <div className="border border-gray-200 rounded-2xl p-5 space-y-4 bg-white">
            <div>
              <h3 className="font-black text-gray-900">Vehicle Images</h3>
              <p className="text-xs text-gray-500 mt-1">Upload vehicle images to show customers</p>
            </div>
            
            {existingImages.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {existingImages.map((img) => (
                  <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-video border border-gray-200">
                    <img src={img.imageUrl} alt="Car" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        type="button"
                        onClick={async () => {
                          if (!initialData) return;
                          try {
                            await deleteCarImage(initialData.id, img.id);
                            setExistingImages(cur => cur.filter(i => i.id !== img.id));
                            toast.success('Image deleted');
                          } catch {
                            toast.error('Error deleting image');
                          }
                        }}
                        className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors" title="Delete image"
                      >
                        <Trash2 size={16} />
                      </button>
                      {!img.primary && (
                        <button 
                          type="button"
                          onClick={async () => {
                            if (!initialData) return;
                            try {
                              await setPrimaryCarImage(initialData.id, img.id);
                              setExistingImages(cur => cur.map(i => ({ ...i, primary: i.id === img.id })));
                              toast.success('Set as primary image');
                            } catch {
                              toast.error('Error setting primary image');
                            }
                          }}
                          className="p-1.5 bg-[#78ad44] text-white rounded-lg hover:bg-[#689938] transition-colors" title="Set as primary image"
                        >
                          <Star size={16} />
                        </button>
                      )}
                    </div>
                    {img.primary && (
                      <div className="absolute top-2 left-2 bg-[#78ad44] text-white text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                        <Star size={10} fill="currentColor" /> PRIMARY
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setCarFiles(Array.from(e.target.files ?? []))}
                className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-bold file:text-blue-600 hover:file:bg-blue-100"
              />
              {carFiles.length > 0 && (
                <p className="text-xs font-bold text-gray-500 mt-2">{carFiles.length} new images selected</p>
              )}
            </div>
          </div>
          
          {!initialData && (
            <div className="border border-gray-200 rounded-2xl p-5 space-y-4 bg-[#f8f9fa]">
              <div>
                <h3 className="font-black text-gray-900">Initial car condition</h3>
                <p className="text-xs text-gray-500 mt-1">Condition is recorded as GOOD. Add notes and photos when needed.</p>
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
            Cancel
          </button>
          <button
            type="submit"
            form="car-form"
            disabled={isSaving}
            className="flex-1 py-3 bg-[#78ad44] hover:bg-[#689938] text-white font-bold rounded-xl transition-colors shadow-md disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
            {initialData ? 'Save Changes' : 'Add Vehicle'}
          </button>
        </div>
      </div>
    </div>
  );
}
