import AdminLayout from '@/components/layout/AdminLayout';
import { Search, Filter, Eye, Check, X } from 'lucide-react';

const MOCK_BOOKINGS = [
  { id: 'RC-9482', customer: 'Sarah Connor', car: 'Mercedes S-Class', startDate: 'Oct 25, 2024', endDate: 'Oct 28, 2024', status: 'Pending', total: 450 },
  { id: 'RC-8472', customer: 'John Doe', car: 'Tesla Model 3', startDate: 'Oct 24, 2024', endDate: 'Oct 26, 2024', status: 'Active', total: 320 },
  { id: 'RC-7462', customer: 'Bruce Wayne', car: 'BMW X5', startDate: 'Oct 22, 2024', endDate: 'Oct 25, 2024', status: 'Completed', total: 850 },
  { id: 'RC-6452', customer: 'Clark Kent', car: 'Ford Mustang', startDate: 'Oct 20, 2024', endDate: 'Oct 21, 2024', status: 'Cancelled', total: 200 },
  { id: 'RC-5442', customer: 'Diana Prince', car: 'Porsche 911', startDate: 'Oct 30, 2024', endDate: 'Nov 02, 2024', status: 'Pending', total: 600 },
];

export default function AdminBookingsPage() {
  return (
    <AdminLayout title="Bookings Management">
      
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by ID, Customer..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#78ad44]"
            />
          </div>
          <button className="flex items-center gap-2 bg-white border border-gray-100 text-gray-600 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors font-bold text-sm shadow-sm">
            <Filter size={16} /> Filters
          </button>
        </div>
        
        <div className="flex bg-[#f4f8f7] p-1 rounded-xl">
          <button className="px-4 py-2 text-xs font-bold rounded-lg bg-white text-gray-900 shadow-sm border border-gray-200">All</button>
          <button className="px-4 py-2 text-xs font-bold rounded-lg text-gray-500 hover:text-gray-900">Pending</button>
          <button className="px-4 py-2 text-xs font-bold rounded-lg text-gray-500 hover:text-gray-900">Active</button>
          <button className="px-4 py-2 text-xs font-bold rounded-lg text-gray-500 hover:text-gray-900">Completed</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f4f8f7] border-b border-gray-100">
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Booking ID</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Customer & Car</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Rental Dates</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Total</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider">Status</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_BOOKINGS.map(b => (
                <tr key={b.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-5">
                    <span className="font-black text-gray-900 text-sm">{b.id}</span>
                  </td>
                  <td className="p-5">
                    <p className="font-black text-gray-900 text-sm">{b.customer}</p>
                    <p className="font-bold text-gray-400 text-xs">{b.car}</p>
                  </td>
                  <td className="p-5">
                    <p className="text-sm font-bold text-gray-900">{b.startDate}</p>
                    <p className="text-xs font-bold text-gray-400">to {b.endDate}</p>
                  </td>
                  <td className="p-5 font-black text-[#78ad44]">${b.total}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wider border ${
                      b.status === 'Active' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      b.status === 'Completed' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                      b.status === 'Pending' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                      'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {b.status === 'Pending' && (
                        <>
                          <button className="p-2 text-white bg-[#78ad44] hover:bg-[#689938] rounded-lg transition-colors shadow-sm" title="Approve"><Check size={16} /></button>
                          <button className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm" title="Reject"><X size={16} /></button>
                        </>
                      )}
                      <button className="p-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors shadow-sm font-bold flex items-center gap-1" title="View Details">
                        <Eye size={16} /> <span className="text-xs">View</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination mock */}
        <div className="p-5 border-t border-gray-100 flex items-center justify-between">
           <p className="text-xs font-bold text-gray-400">Showing 1 to 5 of 128 bookings</p>
           {/* Pagination hidden for brevity */}
        </div>

      </div>

    </AdminLayout>
  );
}
