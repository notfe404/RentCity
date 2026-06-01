import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Calendar, DollarSign, Flame, ListOrdered, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import AdminLayout from '@/components/layout/AdminLayout';
import { getAdminMonthlyDashboard } from '@/services/bookingApi';
import { formatVND, formatVNDShort } from '@/utils/formatters';
import type { AdminDashboardMonthlyStats } from '@/types';

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: '2-digit',
});

function formatMonth(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  return monthFormatter.format(new Date(year, month - 1, 1));
}

function numberText(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value);
}

export default function AdminDashboardPage() {
  const [monthlyStats, setMonthlyStats] = useState<AdminDashboardMonthlyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const { data } = await getAdminMonthlyDashboard();
        if (!cancelled) {
          setMonthlyStats(data);
          setLoadError(false);
        }
      } catch {
        if (!cancelled) {
          setLoadError(true);
          toast.error('Cannot load admin dashboard data');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const totalBookings = monthlyStats.reduce((sum, item) => sum + item.totalBookings, 0);
    const totalRevenue = monthlyStats.reduce((sum, item) => sum + item.completedRevenue, 0);
    const currentMonth = monthlyStats.at(-1);
    const bestMonth = [...monthlyStats].sort((left, right) => {
      if (right.totalBookings !== left.totalBookings) {
        return right.totalBookings - left.totalBookings;
      }
      return right.completedRevenue - left.completedRevenue;
    })[0];

    return { totalBookings, totalRevenue, currentMonth, bestMonth };
  }, [monthlyStats]);

  const maxRevenue = Math.max(...monthlyStats.map((item) => item.completedRevenue), 0);
  const maxBookings = Math.max(...monthlyStats.map((item) => item.totalBookings), 0);

  const stats = [
    {
      label: 'Completed revenue',
      value: formatVND(summary.totalRevenue),
      detail: 'Last 12 months',
      icon: DollarSign,
    },
    {
      label: 'Total bookings',
      value: numberText(summary.totalBookings),
      detail: 'All booking statuses',
      icon: ListOrdered,
    },
    {
      label: 'Current month',
      value: numberText(summary.currentMonth?.totalBookings ?? 0),
      detail: summary.currentMonth ? formatVND(summary.currentMonth.completedRevenue) : 'No data',
      icon: Calendar,
    },
    {
      label: 'Hot vehicle',
      value: summary.currentMonth?.hotVehicle?.vehicleName ?? 'No booking',
      detail: summary.currentMonth?.hotVehicle
        ? `${summary.currentMonth.hotVehicle.bookingCount} booking(s)`
        : 'This month',
      icon: Flame,
    },
  ];

  return (
    <AdminLayout title="Dashboard Overview">
      {isLoading && (
        <div className="min-h-[420px] flex items-center justify-center text-gray-500 font-bold">
          <Loader2 className="mr-3 animate-spin text-[#78ad44]" size={22} />
          Loading dashboard data...
        </div>
      )}

      {!isLoading && loadError && (
        <div className="bg-white rounded-[1.5rem] border border-red-100 p-8 text-red-500 font-bold flex items-center gap-3">
          <AlertCircle size={22} />
          Dashboard data is unavailable. Please try again after the backend is running.
        </div>
      )}

      {!isLoading && !loadError && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
              >
                <div className="flex justify-between items-start mb-5">
                  <div className="p-3 bg-[#f4f8f7] rounded-xl text-[#78ad44]">
                    <stat.icon size={24} />
                  </div>
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-[#e9f2eb] text-[#78ad44]">
                    Live
                  </span>
                </div>
                <p className="text-2xl font-black text-gray-900 mb-1 truncate" title={stat.value}>
                  {stat.value}
                </p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-xs font-bold text-gray-500 mt-3 truncate">{stat.detail}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-[1.5rem] border border-gray-100 p-8 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900">Monthly Booking Analytics</h3>
                  <p className="text-xs font-bold text-gray-400 mt-1">
                    Group by month: bookings, completed revenue, and hot vehicle
                  </p>
                </div>
                <div className="bg-[#f4f8f7] text-gray-600 text-xs font-black rounded-lg px-4 py-2">
                  Rolling 12 months
                </div>
              </div>

              {monthlyStats.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-gray-400 font-bold">
                  No dashboard data yet
                </div>
              ) : (
                <div className="h-80 flex items-end justify-between gap-3 px-1 pb-2">
                  {monthlyStats.map((item) => {
                    const valueForHeight = maxRevenue > 0 ? item.completedRevenue : item.totalBookings;
                    const maxForHeight = maxRevenue > 0 ? maxRevenue : maxBookings;
                    const height = maxForHeight > 0 ? Math.max(8, Math.round((valueForHeight / maxForHeight) * 100)) : 0;

                    return (
                      <div key={item.month} className="flex-1 min-w-0 h-full flex flex-col justify-end group">
                        <div className="relative h-full bg-[#f4f8f7] rounded-t-xl overflow-hidden flex items-end">
                          <div
                            className="w-full bg-[#78ad44] rounded-t-xl transition-all duration-500 group-hover:bg-[#689938]"
                            style={{ height: `${height}%` }}
                          />
                          <div className="absolute inset-x-2 top-3 text-center">
                            <p className="text-[11px] font-black text-gray-900 truncate">
                              {formatVNDShort(item.completedRevenue)}
                            </p>
                            <p className="text-[10px] font-bold text-gray-500">{item.totalBookings} booking(s)</p>
                          </div>
                        </div>
                        <p className="mt-3 text-center text-xs font-black text-gray-500 truncate">
                          {formatMonth(item.month)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-[1.5rem] border border-gray-100 p-8 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900">Hot Vehicles</h3>
                  <p className="text-xs font-bold text-gray-400 mt-1">Top booked vehicle by month</p>
                </div>
                <Link to="/admin/bookings" className="text-sm font-bold text-[#78ad44] hover:underline">
                  View bookings
                </Link>
              </div>

              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {[...monthlyStats].reverse().map((item) => (
                  <div key={item.month} className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-[#f4f8f7] flex items-center justify-center text-[#78ad44]">
                        <Flame size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-wider">
                          {formatMonth(item.month)}
                        </p>
                        <p className="text-sm font-black text-gray-900 truncate">
                          {item.hotVehicle?.vehicleName ?? 'No booking'}
                        </p>
                        <p className="text-xs font-bold text-gray-400 truncate">
                          {item.hotVehicle?.licensePlate ?? 'No license plate'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-[#78ad44]">
                        {item.hotVehicle?.bookingCount ?? 0}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Bookings</p>
                    </div>
                  </div>
                ))}
              </div>

              {summary.bestMonth && (
                <div className="mt-6 border-t border-gray-100 pt-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Best month</p>
                  <p className="text-lg font-black text-gray-900 mt-1">{formatMonth(summary.bestMonth.month)}</p>
                  <p className="text-sm font-bold text-gray-500">
                    {numberText(summary.bestMonth.totalBookings)} booking(s), {formatVND(summary.bestMonth.completedRevenue)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
