import { X, Upload, Users, Settings, Fuel } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

export interface Vehicle {
  id: string;
  name: string;
  category: string;
  price: number;
  status: string;
  trips: number;
  rating: number;
  imageUrl?: string;
  specs?: {
    seats?: number;
    transmission?: string;
    fuelType?: string;
  };
}

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicle: Omit<Vehicle, 'id' | 'trips' | 'rating'>) => void;
  initialData?: Vehicle | null;
}

export default function VehicleModal({ isOpen, onClose, onSave, initialData }: VehicleModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Luxury Sedan',
    price: 0,
    status: 'Available',
    imageUrl: '',
    specs: {
      seats: 4,
      transmission: 'Automatic',
      fuelType: 'Gasoline'
    }
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        category: initialData.category,
        price: initialData.price,
        status: initialData.status,
        imageUrl: initialData.imageUrl || '',
        specs: {
          seats: initialData.specs?.seats || 4,
          transmission: initialData.specs?.transmission || 'Automatic',
          fuelType: initialData.specs?.fuelType || 'Gasoline'
        }
      });
    } else {
      setFormData({ 
        name: '', 
        category: 'Luxury Sedan', 
        price: 0, 
        status: 'Available',
        imageUrl: '',
        specs: { seats: 4, transmission: 'Automatic', fuelType: 'Gasoline' }
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData({ ...formData, imageUrl });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-[#f8f9fa] shrink-0">
          <h2 className="font-bold text-[#1f2937] text-lg">
            {initialData ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-5 custom-scrollbar">
          <form id="vehicle-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Vehicle Image</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors overflow-hidden relative ${
                  formData.imageUrl ? 'border-transparent bg-gray-50' : 'border-gray-300 hover:border-[#78ad44] hover:bg-[#f4f8f7]'
                }`}
              >
                {formData.imageUrl ? (
                  <>
                    <img src={formData.imageUrl} alt="Vehicle preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-bold flex items-center gap-2"><Upload size={18} /> Change Image</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-1">
                      <Upload size={20} />
                    </div>
                    <p className="text-sm font-bold text-gray-600">Click to upload image</p>
                    <p className="text-xs font-medium text-gray-400">JPG, PNG or WEBP (max. 5MB)</p>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <div className="md:col-span-2">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">Basic Information</h3>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">Vehicle Name</label>
                <input 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-[#78ad44] rounded-xl outline-none transition-colors"
                  placeholder="e.g. Mercedes-Benz S-Class"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">Category</label>
                <select 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})} 
                  className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-[#78ad44] rounded-xl outline-none transition-colors appearance-none"
                >
                  <option>Luxury Sedan</option>
                  <option>Electric</option>
                  <option>SUV</option>
                  <option>Sports</option>
                  <option>Sedan</option>
                  <option>Compact</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">Status</label>
                <select 
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value})} 
                  className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-[#78ad44] rounded-xl outline-none transition-colors appearance-none"
                >
                  <option>Available</option>
                  <option>Rented</option>
                  <option>Maintenance</option>
                </select>
              </div>
            </div>

            {/* Technical Specs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <div className="md:col-span-3">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-2">Technical Specs</h3>
              </div>
              
              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mb-1.5 px-1">
                  <Users size={14} className="text-gray-400" /> Seats
                </label>
                <input 
                  type="number" min="1" max="10"
                  value={formData.specs.seats} 
                  onChange={e => setFormData({...formData, specs: {...formData.specs, seats: Number(e.target.value)}})} 
                  className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-[#78ad44] rounded-xl outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mb-1.5 px-1">
                  <Settings size={14} className="text-gray-400" /> Transmission
                </label>
                <select 
                  value={formData.specs.transmission} 
                  onChange={e => setFormData({...formData, specs: {...formData.specs, transmission: e.target.value}})} 
                  className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-[#78ad44] rounded-xl outline-none transition-colors appearance-none"
                >
                  <option>Automatic</option>
                  <option>Manual</option>
                </select>
              </div>
              
              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mb-1.5 px-1">
                  <Fuel size={14} className="text-gray-400" /> Fuel
                </label>
                <select 
                  value={formData.specs.fuelType} 
                  onChange={e => setFormData({...formData, specs: {...formData.specs, fuelType: e.target.value}})} 
                  className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-[#78ad44] rounded-xl outline-none transition-colors appearance-none"
                >
                  <option>Gasoline</option>
                  <option>Diesel</option>
                  <option>Electric</option>
                  <option>Hybrid</option>
                </select>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-[#f4f8f7] p-4 rounded-xl border border-[#e9f2eb] flex items-center justify-between">
              <label className="block text-sm font-bold text-[#689938] px-1">Price / Day ($)</label>
              <input 
                required 
                type="number" 
                min="0" 
                value={formData.price} 
                onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                className="w-32 px-4 py-2 bg-white border border-[#78ad44]/30 focus:border-[#78ad44] rounded-xl outline-none transition-colors text-right font-black text-lg text-[#1f2937]"
              />
            </div>
            
          </form>
        </div>

        <div className="mt-auto p-5 border-t border-gray-100 flex gap-3 shrink-0 bg-white">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-600 font-bold bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="vehicle-form"
            className="flex-1 px-4 py-3 bg-[#78ad44] hover:bg-[#689938] text-white font-bold rounded-xl shadow-md shadow-[#78ad44]/20 transition-all active:scale-[0.98]"
          >
            {initialData ? 'Save Changes' : 'Add Vehicle'}
          </button>
        </div>
      </div>
    </div>
  );
}
