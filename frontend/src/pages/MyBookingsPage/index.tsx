import { useState, useMemo } from 'react';
import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import CustomerSidebar from '@/components/layout/CustomerSidebar';
import { Calendar, MapPin, ChevronRight, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { MOCK_BOOKINGS, BOOKING_STATUS_LABEL, type MockBookingStatus } from '@/data/mockBookings';
import { formatVND, formatDate } from '@/utils/formatters';

type TabFilter = 'all' | MockBookingStatus;

const TABS: { key: TabFilter; label: string }[] = [
  { key: 'all',       label: 'Tất cả' },
  { key: 'upcoming',  label: 'Sắp tới' },
  { key: 'active',    label: 'Đang thuê' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'cancelled', label: 'Đã hủy' },
];

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  const filtered = useMemo(() => {
    if (activeTab === 'all') return MOCK_BOOKINGS;
    return MOCK_BOOKINGS.filter(b => b.status === activeTab);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Header />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1 flex flex-col lg:flex-row gap-10">
        <CustomerSidebar />

        <div className="flex-1 space-y-8">
          <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-gray-100 min-h-full">
            <h2 className="text-2xl font-black text-gray-900 mb-8 border-b border-gray-100 pb-4">Đơn đặt xe của tôi</h2>

            {/* Tabs */}
            <div className="flex gap-3 mb-8 overflow-x-auto pb-2 hide-scrollbar">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-2.5 rounded-full font-bold text-sm shrink-0 transition-all ${
                    activeTab === tab.key
                      ? 'bg-[#212529] text-white shadow-md'
                      : 'bg-[#f4f8f7] text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Booking list */}
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {filtered.map(booking => {
                  const statusCfg = BOOKING_STATUS_LABEL[booking.status];
                  return (
                    <motion.div
                      key={booking.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.25 }}
                      className="border border-gray-100 rounded-[1.5rem] p-4 flex flex-col sm:flex-row gap-6 hover:shadow-lg transition-shadow bg-white cursor-pointer"
                      onClick={() => navigate(`/my-bookings/${booking.id}`)}
                    >
                      <div className="w-full sm:w-48 h-32 shrink-0 rounded-xl overflow-hidden relative">
                        <img src={booking.vehicle.image} alt={booking.vehicle.name} className="w-full h-full object-cover" />
                        <div className={`absolute top-2 left-2 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider text-white ${statusCfg.bg}`}>
                          {statusCfg.label}
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-black text-gray-900">{booking.vehicle.name}</h3>
                            <span className="text-lg font-black text-[#78ad44]">{formatVND(booking.totalAmount)}</span>
                          </div>
                          <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Mã: {booking.bookingCode}</p>

                          <div className="flex flex-col sm:flex-row gap-x-6 gap-y-2 text-sm text-gray-600 font-medium">
                            <div className="flex items-center gap-2">
                              <Calendar size={16} className="text-[#78ad44]" />
                              {formatDate(booking.startDate)} – {formatDate(booking.endDate)}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin size={16} className="text-[#78ad44]" />
                              {booking.pickupLocationName}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 sm:mt-0 flex justify-end">
                          <button className="text-sm font-bold bg-[#f4f8f7] hover:bg-gray-100 text-gray-900 px-5 py-2.5 rounded-xl transition-colors flex items-center gap-1">
                            Xem chi tiết <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filtered.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-[#f4f8f7] rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                    <Car size={40} />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">Chưa có đơn nào</h3>
                  <p className="text-gray-500 font-medium mb-6">Bạn chưa có đơn đặt xe nào trong mục này.</p>
                  <button
                    onClick={() => navigate('/search')}
                    className="bg-[#78ad44] text-white px-6 py-3 rounded-full font-bold shadow-lg"
                  >
                    Tìm xe ngay
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
