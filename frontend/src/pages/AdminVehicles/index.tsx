import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Plus, Search, Filter, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import VehicleModal, { type Vehicle } from './VehicleModal';

const INITIAL_VEHICLES: Vehicle[] = [
  { id: 'V-1001', name: 'Mercedes-Benz S-Class', category: 'Luxury Sedan', price: 150, status: 'Available', trips: 45, rating: 4.9, imageUrl: 'https://images.unsplash.com/photo-1549314424-d2eab31d0db2?auto=format&fit=crop&w=400&q=80', specs: { seats: 4, transmission: 'Automatic', fuelType: 'Gasoline' } },
  { id: 'V-1002', name: 'Tesla Model 3', category: 'Electric', price: 80, status: 'Rented', trips: 128, rating: 4.8, specs: { seats: 5, transmission: 'Automatic', fuelType: 'Electric' } },
  { id: 'V-1003', name: 'Range Rover Sport', category: 'SUV', price: 120, status: 'Maintenance', trips: 32, rating: 4.7, specs: { seats: 7, transmission: 'Automatic', fuelType: 'Diesel' } },
  { id: 'V-1004', name: 'Porsche 911', category: 'Sports', price: 200, status: 'Available', trips: 18, rating: 5.0, specs: { seats: 2, transmission: 'Manual', fuelType: 'Gasoline' } },
  { id: 'V-1005', name: 'Toyota Camry', category: 'Sedan', price: 40, status: 'Rented', trips: 310, rating: 4.5, specs: { seats: 5, transmission: 'Automatic', fuelType: 'Hybrid' } },
  { id: 'V-1006', name: 'Audi e-tron GT', category: 'Electric', price: 180, status: 'Available', trips: 12, rating: 4.9, specs: { seats: 4, transmission: 'Automatic', fuelType: 'Electric' } },
  { id: 'V-1007', name: 'Honda CR-V', category: 'SUV', price: 60, status: 'Available', trips: 89, rating: 4.4, specs: { seats: 5, transmission: 'Automatic', fuelType: 'Gasoline' } },
];

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset page on search
  };

  const filteredVehicles = vehicles.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / itemsPerPage));
  const currentVehicles = filteredVehicles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      setVehicles(prev => prev.filter(v => v.id !== id));
      toast.success(`${name} has been deleted successfully`);
      
      // Auto-adjust page if we delete the last item on current page
      if (currentVehicles.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  const handleSave = (data: Omit<Vehicle, 'id' | 'trips' | 'rating'>) => {
    if (editingVehicle) {
      setVehicles(vehicles.map(v => v.id === editingVehicle.id ? { ...v, ...data } : v));
      toast.success('Vehicle updated successfully');
    } else {
      const newVehicle: Vehicle = {
        ...data,
        id: `V-${Math.floor(1000 + Math.random() * 9000)}`, // Generate random ID V-XXXX
        trips: 0,
        rating: 0
      };
      setVehicles([newVehicle, ...vehicles]);
      toast.success('Vehicle added successfully');
      setCurrentPage(1); // Go back to first page to see the new item
    }
  };

  const openAddModal = () => {
    setEditingVehicle(null);
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsModalOpen(true);
  };

  return (
    <AdminLayout title="Vehicles Management">
      
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#78ad44]" size={18} />
            <input 
              type="text" 
              placeholder="Search vehicles..." 
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#78ad44]/20 focus:border-[#78ad44] transition-all"
            />
          </div>
          <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-3 rounded-xl hover:bg-gray-50 focus:ring-2 focus:ring-[#78ad44]/20 transition-all font-bold text-sm shadow-sm group">
            <Filter size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" /> Filters
          </button>
        </div>
        <button 
          onClick={openAddModal}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#78ad44] hover:bg-[#689938] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md shadow-[#78ad44]/20 active:scale-[0.98]"
        >
          <Plus size={18} /> Add New Vehicle
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_20px_rgb(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-gray-100">
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Vehicle</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Category</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Price/Day</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Status</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Stats</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentVehicles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-400 font-medium">
                    No vehicles found matching "{searchQuery}"
                  </td>
                </tr>
              ) : currentVehicles.map(v => (
                <tr key={v.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      {v.imageUrl ? (
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                          <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400 font-bold uppercase overflow-hidden">
                          {v.name.substring(0,2)}
                        </div>
                      )}
                      <div>
                        <p className="font-black text-gray-900 text-sm group-hover:text-[#78ad44] transition-colors">{v.name}</p>
                        <p className="font-bold text-gray-400 text-xs">ID: {v.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="bg-[#f8f9fa] text-gray-600 px-3 py-1 text-xs font-bold rounded-lg border border-gray-200">{v.category}</span>
                  </td>
                  <td className="p-5 font-black text-gray-900">${v.price}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                      v.status === 'Available' ? 'bg-[#e9f2eb] text-[#78ad44]' :
                      v.status === 'Rented' ? 'bg-blue-50 text-blue-600' :
                      'bg-orange-50 text-orange-600'
                    }`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="p-5">
                    <p className="text-xs font-bold text-gray-900">{v.trips} Trips</p>
                    <p className={`text-xs font-bold ${v.rating > 0 ? 'text-[#f99200]' : 'text-gray-400'}`}>
                      ★ {v.rating > 0 ? v.rating.toFixed(1) : 'New'}
                    </p>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex items-center justify-end gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(v)}
                        title="Edit Vehicle"
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(v.id, v.name)}
                        title="Delete Vehicle"
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-[#f8f9fa]/50">
          <p className="text-xs font-black text-gray-500">
            Showing <span className="text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-gray-900">{Math.min(currentPage * itemsPerPage, filteredVehicles.length)}</span> of <span className="text-gray-900">{filteredVehicles.length}</span> entries
          </p>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                Prev
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    currentPage === i + 1 
                      ? 'bg-[#78ad44] text-white shadow-sm shadow-[#78ad44]/30' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Add / Edit Modal */}
      <VehicleModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingVehicle}
      />

    </AdminLayout>
  );
}
