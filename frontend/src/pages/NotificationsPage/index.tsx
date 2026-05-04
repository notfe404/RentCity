import { useState, useMemo } from 'react';
import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import CustomerSidebar from '@/components/layout/CustomerSidebar';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { MOCK_NOTIFICATIONS } from '@/data/mockNotifications';
import { formatDateTime } from '@/utils/formatters';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotif = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClick = (notif: typeof notifications[0]) => {
    // Mark as read
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    // Navigate if has booking link
    if (notif.data?.booking_id) {
      navigate(`/my-bookings/${notif.data.booking_id}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Header />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1 flex flex-col lg:flex-row gap-10">
        <CustomerSidebar />

        <div className="flex-1 space-y-8">
          <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-gray-100 min-h-full">
            <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-gray-900">Thông báo</h2>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-black rounded-full w-6 h-6 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-2 text-sm font-bold text-[#78ad44] hover:text-[#689938] transition-colors"
                >
                  <CheckCheck size={16} /> Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {notifications.map(notif => (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleClick(notif)}
                    className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer transition-all group ${
                      notif.isRead
                        ? 'bg-white hover:bg-gray-50 border border-gray-100'
                        : 'bg-[#f4f8f7] border-2 border-[#78ad44]/20 hover:border-[#78ad44]/40'
                    }`}
                  >
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl shrink-0 border border-gray-100">
                      {notif.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-bold text-sm ${notif.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notif.title}
                          {!notif.isRead && <span className="ml-2 w-2 h-2 bg-[#78ad44] rounded-full inline-block" />}
                        </h4>
                        <span className="text-xs text-gray-400 font-medium shrink-0 ml-4">{formatDateTime(notif.createdAt)}</span>
                      </div>
                      <p className={`text-sm font-medium leading-relaxed ${notif.isRead ? 'text-gray-500' : 'text-gray-600'}`}>
                        {notif.body}
                      </p>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {notifications.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-[#f4f8f7] rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                    <Bell size={40} />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">Không có thông báo</h3>
                  <p className="text-gray-500 font-medium">Bạn đã xem hết tất cả thông báo.</p>
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
