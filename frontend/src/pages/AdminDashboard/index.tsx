import AdminLayout from '@/components/layout/AdminLayout';
import { TrendingUp, Users, Car, ListOrdered, DollarSign, Calendar } from 'lucide-react';

const STATS = [
  { label: 'Total Revenue', value: '$24,580', change: '+14.5%', icon: DollarSign, isUp: true },
  { label: 'Active Rentals', value: '42', change: '+5.2%', icon: Car, isUp: true },
  { label: 'Total Bookings', value: '1,280', change: '-2.4%', icon: ListOrdered, isUp: false },
  { label: 'Registered Users', value: '3,492', change: '+18.1%', icon: Users, isUp: true },
];

const RECENT_BOOKINGS = [
  { id: '#RC-9482', customer: 'Sarah Connor', car: 'Mercedes S-Class', date: 'Oct 25', status: 'Pending', amount: '$450' },
  { id: '#RC-8472', customer: 'John Doe', car: 'Tesla Model 3', date: 'Oct 24', status: 'Active', amount: '$320' },
  { id: '#RC-7462', customer: 'Bruce Wayne', car: 'BMW X5', date: 'Oct 22', status: 'Completed', amount: '$850' },
  { id: '#RC-6452', customer: 'Clark Kent', car: 'Ford Mustang', date: 'Oct 20', status: 'Cancelled', amount: '$200' },
];

export default function AdminDashboardPage() {
  return (
    <AdminLayout title="Dashboard Overview">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {STATS.map(stat => (
          <div key={stat.label} className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-[#f4f8f7] rounded-xl text-[#78ad44]">
                <stat.icon size={24} />
              </div>
              <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${stat.isUp ? 'bg-[#e9f2eb] text-[#78ad44]' : 'bg-red-50 text-red-500'}`}>
                {stat.isUp ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />}
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900 mb-1">{stat.value}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart Area (Mock) */}
        <div className="lg:col-span-2 bg-white rounded-[1.5rem] border border-gray-100 p-8 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
            <h3 className="text-lg font-black text-gray-900">Revenue Analytics</h3>
            <select className="bg-[#f4f8f7] border-none text-sm font-bold text-gray-600 rounded-lg px-4 py-2 outline-none cursor-pointer">
              <option>Last 7 Days</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-64 flex items-end justify-between gap-2 px-4 relative">
             {/* Mock bars */}
             {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
               <div key={i} className="w-full bg-[#f4f8f7] rounded-t-xl group relative flex justify-center h-full items-end">
                 <div style={{ height: `${h}%` }} className="w-full bg-[#78ad44] rounded-t-xl transition-all duration-500 group-hover:bg-[#689938]"></div>
                 <span className="absolute -bottom-6 text-xs font-bold text-gray-400">Day {i+1}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Recent Bookings List */}
        <div className="bg-white rounded-[1.5rem] border border-gray-100 p-8 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
            <h3 className="text-lg font-black text-gray-900">Recent Bookings</h3>
            <button className="text-sm font-bold text-[#78ad44] hover:underline">View All</button>
          </div>
          
          <div className="space-y-5">
            {RECENT_BOOKINGS.map(b => (
              <div key={b.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#f4f8f7] flex items-center justify-center text-[#78ad44]">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">{b.customer}</p>
                    <p className="text-xs font-bold text-gray-400">{b.car}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[#78ad44]">{b.amount}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${
                    b.status === 'Active' ? 'text-blue-500' : 
                    b.status === 'Completed' ? 'text-gray-500' : 
                    b.status === 'Pending' ? 'text-orange-500' : 'text-red-500'
                  }`}>{b.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </AdminLayout>
  );
}
