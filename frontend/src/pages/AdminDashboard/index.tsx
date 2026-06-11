import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  Car,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  DollarSign,
  Flame,
  ListOrdered,
  Loader2,
  ShieldCheck,
  TrendingDown,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';

import AdminLayout from '@/components/layout/AdminLayout';
import { getAdminDashboardOverview, getAdminMonthlyDashboard } from '@/services/bookingApi';
import { BOOKING_STATUS_META, DEPOSIT_STATUS_META } from '@/utils/bookingMapper';
import { formatDate, formatDateTime, formatVND, formatVNDShort } from '@/utils/formatters';
import type { AdminDashboardMonthlyStats, AdminDashboardOverview } from '@/types';

type TimeRange = 'rolling' | 'year' | 'month';

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: '2-digit',
});

const TIME_FILTERS: Array<{ key: TimeRange; label: string }> = [
  { key: 'rolling', label: 'Rolling 12 months' },
  { key: 'year', label: 'This year' },
  { key: 'month', label: 'This month' },
];

const EMPTY_OVERVIEW: AdminDashboardOverview = {
  bookingOperations: {
    pendingBookings: 0,
    confirmedPickupsToday: 0,
    ongoingBookings: 0,
    returnsToday: 0,
  },
  fleetStatus: {
    totalCars: 0,
    availableCars: 0,
    maintenanceCars: 0,
    retiredCars: 0,
    carsWithoutImages: 0,
  },
  paymentStatus: {
    pendingPayments: 0,
    paidPayments: 0,
    failedPayments: 0,
    refundedPayments: 0,
    expiredPayments: 0,
  },
  totalBookingsLast12Months: 0,
  cancelledBookingsLast12Months: 0,
  cancellationRate: 0,
  pendingKycUsers: 0,
  recentBookings: [],
};

function formatMonth(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  return monthFormatter.format(new Date(year, month - 1, 1));
}

function numberText(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function percentText(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export default function AdminDashboardPage() {
  const [monthlyStats, setMonthlyStats] = useState<AdminDashboardMonthlyStats[]>([]);
  const [overview, setOverview] = useState<AdminDashboardOverview | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('rolling');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const [monthlyResponse, overviewResponse] = await Promise.all([
          getAdminMonthlyDashboard(),
          getAdminDashboardOverview(),
        ]);

        if (!cancelled) {
          setMonthlyStats(monthlyResponse.data);
          setOverview(overviewResponse.data);
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

  const filteredMonthlyStats = useMemo(() => {
    if (timeRange === 'rolling') {
      return monthlyStats;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (timeRange === 'year') {
      return monthlyStats.filter((item) => Number(item.month.slice(0, 4)) === currentYear);
    }

    return monthlyStats.filter((item) => item.month === currentMonth);
  }, [monthlyStats, timeRange]);

  const summary = useMemo(() => {
    const totalBookings = filteredMonthlyStats.reduce((sum, item) => sum + item.totalBookings, 0);
    const totalRevenue = filteredMonthlyStats.reduce((sum, item) => sum + item.completedRevenue, 0);
    const currentMonth = monthlyStats.at(-1);
    const bestMonth = [...filteredMonthlyStats].sort((left, right) => {
      if (right.totalBookings !== left.totalBookings) {
        return right.totalBookings - left.totalBookings;
      }
      return right.completedRevenue - left.completedRevenue;
    })[0];

    return { totalBookings, totalRevenue, currentMonth, bestMonth };
  }, [filteredMonthlyStats, monthlyStats]);

  const dashboard = overview ?? EMPTY_OVERVIEW;
  const maxRevenue = Math.max(...filteredMonthlyStats.map((item) => item.completedRevenue), 0);
  const maxBookings = Math.max(...filteredMonthlyStats.map((item) => item.totalBookings), 0);
  const hasChartData = maxRevenue > 0 || maxBookings > 0;

  const operationStats = [
    {
      label: 'Pending booking',
      value: numberText(dashboard.bookingOperations.pendingBookings),
      detail: 'Need confirmation',
      icon: ClipboardList,
      tone: 'text-orange-600 bg-orange-50',
    },
    {
      label: 'Ongoing rental',
      value: numberText(dashboard.bookingOperations.ongoingBookings),
      detail: 'Vehicles on trip',
      icon: Car,
      tone: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Available cars',
      value: numberText(dashboard.fleetStatus.availableCars),
      detail: `${numberText(dashboard.fleetStatus.totalCars)} total fleet`,
      icon: CheckCircle2,
      tone: 'text-[#78ad44] bg-[#f4f8f7]',
    },
    {
      label: 'Pending payment',
      value: numberText(dashboard.paymentStatus.pendingPayments),
      detail: 'Awaiting settlement',
      icon: CreditCard,
      tone: 'text-purple-600 bg-purple-50',
    },
  ];

  const reportStats = [
    {
      label: 'Completed revenue',
      value: formatVND(summary.totalRevenue),
      detail: TIME_FILTERS.find((filter) => filter.key === timeRange)?.label ?? 'Selected range',
      icon: DollarSign,
    },
    {
      label: 'Total bookings',
      value: numberText(summary.totalBookings),
      detail: 'All booking statuses',
      icon: ListOrdered,
    },
    {
      label: 'Cancellation rate',
      value: percentText(dashboard.cancellationRate),
      detail: `${numberText(dashboard.cancelledBookingsLast12Months)} of ${numberText(dashboard.totalBookingsLast12Months)} bookings`,
      icon: TrendingDown,
    },
    {
      label: 'Hot vehicle',
      value: summary.currentMonth?.hotVehicle?.vehicleName ?? 'No booking',
      detail: summary.currentMonth?.hotVehicle
        ? `${summary.currentMonth.hotVehicle.bookingCount} booking(s) this month`
        : 'This month',
      icon: Flame,
    },
  ];

  const needsAction = [
    {
      label: 'Pending bookings',
      value: dashboard.bookingOperations.pendingBookings,
      detail: 'Confirm or cancel requests',
      icon: ClipboardList,
    },
    {
      label: 'Pickups today',
      value: dashboard.bookingOperations.confirmedPickupsToday,
      detail: 'Confirmed bookings starting today',
      icon: Calendar,
    },
    {
      label: 'Returns today',
      value: dashboard.bookingOperations.returnsToday,
      detail: 'Vehicles expected back today',
      icon: Car,
    },
    {
      label: 'KYC pending',
      value: dashboard.pendingKycUsers,
      detail: 'Users waiting for verification',
      icon: ShieldCheck,
    },
  ];

  const fleetRows = [
    { label: 'Available', value: dashboard.fleetStatus.availableCars, icon: CheckCircle2, color: 'bg-[#78ad44]' },
    { label: 'Maintenance', value: dashboard.fleetStatus.maintenanceCars, icon: Wrench, color: 'bg-orange-500' },
    { label: 'Retired', value: dashboard.fleetStatus.retiredCars, icon: AlertCircle, color: 'bg-gray-500' },
    { label: 'Missing images', value: dashboard.fleetStatus.carsWithoutImages, icon: AlertCircle, color: 'bg-red-500' },
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
            {operationStats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
              >
                <div className="flex justify-between items-start mb-5">
                  <div className={`p-3 rounded-xl ${stat.tone}`}>
                    <stat.icon size={24} />
                  </div>
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-[#e9f2eb] text-[#78ad44]">
                    Live
                  </span>
                </div>
                <p className="text-3xl font-black text-gray-900 mb-1">{stat.value}</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-xs font-bold text-gray-500 mt-3 truncate">{stat.detail}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {reportStats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
              >
                <div className="flex justify-between items-start mb-5">
                  <div className="p-3 bg-[#f4f8f7] rounded-xl text-[#78ad44]">
                    <stat.icon size={24} />
                  </div>
                </div>
                <p className="text-2xl font-black text-gray-900 mb-1 truncate" title={stat.value}>
                  {stat.value}
                </p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-xs font-bold text-gray-500 mt-3 truncate">{stat.detail}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
            <div className="xl:col-span-2 bg-white rounded-[1.5rem] border border-gray-100 p-8 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900">Monthly Booking Analytics</h3>
                  <p className="text-xs font-bold text-gray-400 mt-1">
                    Bookings, completed revenue, and hot vehicle by month
                  </p>
                </div>
                <div className="flex bg-[#f4f8f7] p-1 rounded-xl overflow-x-auto">
                  {TIME_FILTERS.map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setTimeRange(filter.key)}
                      className={`px-4 py-2 text-xs font-black rounded-lg whitespace-nowrap transition-colors ${
                        timeRange === filter.key
                          ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredMonthlyStats.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-gray-400 font-bold">
                  No dashboard data yet
                </div>
              ) : (
                <div className="h-80 flex items-end justify-between gap-3 px-1 pb-2">
                  {filteredMonthlyStats.map((item) => {
                    const valueForHeight = maxRevenue > 0 ? item.completedRevenue : item.totalBookings;
                    const maxForHeight = maxRevenue > 0 ? maxRevenue : maxBookings;
                    const height = hasChartData && valueForHeight > 0
                      ? Math.max(8, Math.round((valueForHeight / maxForHeight) * 100))
                      : 0;

                    return (
                      <div key={item.month} className="flex-1 min-w-0 h-full flex flex-col justify-end group">
                        <div className="relative h-full bg-[#f4f8f7] rounded-t-xl overflow-hidden flex items-end">
                          {height > 0 && (
                            <div
                              className="w-full bg-[#78ad44] rounded-t-xl transition-all duration-500 group-hover:bg-[#689938]"
                              style={{ height: `${height}%` }}
                            />
                          )}
                          <div className="absolute inset-x-2 top-3 text-center">
                            {item.totalBookings > 0 || item.completedRevenue > 0 ? (
                              <>
                                <p className="text-[11px] font-black text-gray-900 truncate">
                                  {formatVNDShort(item.completedRevenue)}
                                </p>
                                <p className="text-[10px] font-bold text-gray-500">{item.totalBookings} booking(s)</p>
                              </>
                            ) : (
                              <p className="text-[10px] font-bold text-gray-300">0</p>
                            )}
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
                  <h3 className="text-lg font-black text-gray-900">Needs Action</h3>
                  <p className="text-xs font-bold text-gray-400 mt-1">Today and pending operations</p>
                </div>
                <Link to="/admin/bookings" className="text-sm font-bold text-[#78ad44] hover:underline">
                  Open bookings
                </Link>
              </div>

              <div className="space-y-4">
                {needsAction.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-[#f4f8f7] flex items-center justify-center text-[#78ad44]">
                        <item.icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-900 truncate">{item.label}</p>
                        <p className="text-xs font-bold text-gray-400 truncate">{item.detail}</p>
                      </div>
                    </div>
                    <p className="text-xl font-black text-gray-900">{numberText(item.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 bg-white rounded-[1.5rem] border border-gray-100 p-8 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900">Recent Bookings</h3>
                  <p className="text-xs font-bold text-gray-400 mt-1">Latest customer activity</p>
                </div>
                <Link to="/admin/bookings" className="text-sm font-bold text-[#78ad44] hover:underline">
                  View all
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      <th className="pb-4 pr-4">Booking</th>
                      <th className="pb-4 pr-4">Customer</th>
                      <th className="pb-4 pr-4">Vehicle</th>
                      <th className="pb-4 pr-4">Status</th>
                      <th className="pb-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dashboard.recentBookings.map((booking) => {
                      const bookingMeta = BOOKING_STATUS_META[booking.status];
                      const depositMeta = DEPOSIT_STATUS_META[booking.depositStatus];

                      return (
                        <tr key={booking.id} className="align-top">
                          <td className="py-4 pr-4">
                            <p className="text-sm font-black text-gray-900">{booking.bookingCode}</p>
                            <p className="text-xs font-bold text-gray-400">{formatDateTime(booking.createdAt)}</p>
                          </td>
                          <td className="py-4 pr-4">
                            <p className="text-sm font-black text-gray-900">{booking.customerName ?? 'Unknown customer'}</p>
                            <p className="text-xs font-bold text-gray-400">{booking.customerEmail ?? 'No email'}</p>
                          </td>
                          <td className="py-4 pr-4">
                            <p className="text-sm font-black text-gray-900">{booking.vehicleName ?? `Vehicle #${booking.vehicleId}`}</p>
                            <p className="text-xs font-bold text-gray-400">{booking.vehicleLicensePlate ?? 'No license plate'}</p>
                          </td>
                          <td className="py-4 pr-4">
                            <span className={`inline-flex px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider text-white ${bookingMeta.bg}`}>
                              {bookingMeta.label}
                            </span>
                            <p className={`text-xs font-bold mt-2 ${depositMeta.color}`}>{depositMeta.label}</p>
                            <p className="text-xs font-bold text-gray-400 mt-1">{formatDate(booking.startTime)}</p>
                          </td>
                          <td className="py-4 text-right">
                            <p className="text-sm font-black text-[#78ad44]">{formatVND(booking.totalAmount)}</p>
                          </td>
                        </tr>
                      );
                    })}

                    {dashboard.recentBookings.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-gray-400 font-bold">
                          No recent bookings yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] border border-gray-100 p-8 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900">Fleet Health</h3>
                  <p className="text-xs font-bold text-gray-400 mt-1">{numberText(dashboard.fleetStatus.totalCars)} vehicles tracked</p>
                </div>
                <Link to="/admin/vehicles" className="text-sm font-bold text-[#78ad44] hover:underline">
                  View fleet
                </Link>
              </div>

              <div className="space-y-5">
                {fleetRows.map((row) => {
                  const width = dashboard.fleetStatus.totalCars > 0
                    ? Math.round((row.value / dashboard.fleetStatus.totalCars) * 100)
                    : 0;

                  return (
                    <div key={row.label}>
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <row.icon size={16} className="text-gray-400 shrink-0" />
                          <span className="text-sm font-black text-gray-900 truncate">{row.label}</span>
                        </div>
                        <span className="text-sm font-black text-gray-900">{numberText(row.value)}</span>
                      </div>
                      <div className="h-2 bg-[#f4f8f7] rounded-full overflow-hidden">
                        <div className={`h-full ${row.color}`} style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {summary.bestMonth && (
                <div className="mt-8 border-t border-gray-100 pt-5">
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
