import { useEffect, useMemo, useState } from 'react';
import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import CustomerSidebar from '@/components/layout/CustomerSidebar';
import { Bell, CheckCheck, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  deleteNotification,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notificationApi';
import { formatDateTime } from '@/utils/formatters';
import type { Notification } from '@/types';

function getNotificationBody(notification: Notification) {
  return notification.body ?? notification.message ?? '';
}

function getNotificationTarget(notification: Notification) {
  const targetUrl = notification.data?.targetUrl;
  if (typeof targetUrl === 'string' && targetUrl) {
    return targetUrl;
  }

  const bookingId = notification.data?.bookingId ?? notification.data?.booking_id;
  if (bookingId) {
    return `/my-bookings/${bookingId}`;
  }

  return null;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadNotifications = async (showSpinner = false) => {
    if (showSpinner) {
      setIsRefreshing(true);
    }

    try {
      setErrorMessage(null);
      const { data } = await getMyNotifications();
      setNotifications(data);
    } catch {
      setNotifications([]);
      setErrorMessage('Không tải được thông báo. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setErrorMessage(null);
        const { data } = await getMyNotifications();
        if (!cancelled) setNotifications(data);
      } catch {
        if (!cancelled) {
          setNotifications([]);
          setErrorMessage('Không tải được thông báo. Vui lòng thử lại sau.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
    } catch {
      // Optimistic update keeps the page responsive.
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() })));
  };

  const handleDelete = async (id: string | number) => {
    try {
      await deleteNotification(id);
    } catch {
      // Optimistic update keeps delete usable if the next refetch catches up.
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification.id);
      } catch {
        // Keep navigation available even if marking read fails.
      }
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() } : n
        )
      );
    }

    const target = getNotificationTarget(notification);
    if (target) {
      navigate(target);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Header />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1 flex flex-col lg:flex-row gap-10">
        <CustomerSidebar />

        <div className="flex-1 space-y-8">
          <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-gray-100 min-h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-gray-900">Thông báo</h2>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-black rounded-full min-w-6 h-6 px-2 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => loadNotifications(true)}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#78ad44] transition-colors disabled:opacity-50"
                >
                  {isRefreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  Làm mới
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-2 text-sm font-bold text-[#78ad44] hover:text-[#689938] transition-colors"
                  >
                    <CheckCheck size={16} /> Đánh dấu đã đọc
                  </button>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={28} className="animate-spin text-[#78ad44]" />
              </div>
            ) : (
              <div className="space-y-3">
                {errorMessage && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
                    {errorMessage}
                  </div>
                )}

                <AnimatePresence>
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => handleClick(notification)}
                      className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer transition-all group ${
                        notification.isRead
                          ? 'bg-white hover:bg-gray-50 border border-gray-100'
                          : 'bg-[#f4f8f7] border-2 border-[#78ad44]/20 hover:border-[#78ad44]/40'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-gray-100">
                        <Bell size={20} className="text-[#78ad44]" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-1">
                          <h4 className={`font-bold text-sm ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notification.title}
                            {!notification.isRead && (
                              <span className="ml-2 w-2 h-2 bg-[#78ad44] rounded-full inline-block" />
                            )}
                          </h4>
                          <span className="text-xs text-gray-400 font-medium shrink-0">
                            {formatDateTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className={`text-sm font-medium leading-relaxed ${notification.isRead ? 'text-gray-500' : 'text-gray-600'}`}>
                          {getNotificationBody(notification)}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 shrink-0"
                        aria-label="Xóa thông báo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {notifications.length === 0 && !errorMessage && (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-[#f4f8f7] rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                      <Bell size={40} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">Chưa có thông báo</h3>
                    <p className="text-gray-500 font-medium">Các cập nhật về booking và thanh toán sẽ xuất hiện tại đây.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
