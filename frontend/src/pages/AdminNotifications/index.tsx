import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Bell, CheckCheck, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  deleteNotification,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notificationApi';
import type { Notification } from '@/types';
import { formatDateTime } from '@/utils/formatters';

type FilterMode = 'ALL' | 'UNREAD';

function getNotificationBody(notification: Notification) {
  return notification.body ?? notification.message ?? '';
}

function getNotificationTarget(notification: Notification) {
  const targetUrl = notification.data?.targetUrl;
  if (typeof targetUrl === 'string' && targetUrl) {
    return targetUrl;
  }
  return null;
}

export default function AdminNotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterMode>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  const loadNotifications = async (nextFilter = filter, showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      setErrorMessage(null);
      const { data } = await getMyNotifications({ unreadOnly: nextFilter === 'UNREAD' });
      setNotifications(data);
    } catch {
      setNotifications([]);
      setErrorMessage('Không tải được thông báo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setErrorMessage(null);
        const { data } = await getMyNotifications({ unreadOnly: filter === 'UNREAD' });
        if (!cancelled) setNotifications(data);
      } catch {
        if (!cancelled) {
          setNotifications([]);
          setErrorMessage('Không tải được thông báo.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    run();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const handleFilterChange = (nextFilter: FilterMode) => {
    setFilter(nextFilter);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
    } catch {
      // Optimistic update.
    }

    if (filter === 'UNREAD') {
      setNotifications([]);
      return;
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() })));
  };

  const handleDelete = async (id: string | number) => {
    try {
      await deleteNotification(id);
    } catch {
      // Optimistic update.
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleOpen = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification.id);
      } catch {
        // Navigation should still work.
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
    <AdminLayout title="Thông báo">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black text-gray-400 uppercase">Notification Center</p>
            <h2 className="text-2xl font-black text-gray-900 mt-1">Việc cần theo dõi</h2>
            <p className="text-sm font-bold text-gray-500 mt-1">{unreadCount} thông báo chưa đọc trong danh sách hiện tại</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-[#f4f8f7] p-1 rounded-xl">
              {(['ALL', 'UNREAD'] as const).map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => handleFilterChange(mode)}
                  className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${
                    filter === mode ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {mode === 'ALL' ? 'Tất cả' : 'Chưa đọc'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => loadNotifications(filter, true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-black text-gray-600 hover:text-[#78ad44] hover:bg-[#f4f8f7] disabled:opacity-50"
            >
              {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Làm mới
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#78ad44] text-white text-sm font-black hover:bg-[#689938]"
              >
                <CheckCheck size={16} /> Đọc hết
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading && (
            <div className="py-20 flex items-center justify-center">
              <Loader2 size={30} className="animate-spin text-[#78ad44]" />
            </div>
          )}

          {!loading && errorMessage && (
            <div className="m-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
              {errorMessage}
            </div>
          )}

          {!loading && !errorMessage && notifications.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-[#f4f8f7] rounded-full flex items-center justify-center mx-auto mb-5 text-gray-300">
                <Bell size={40} />
              </div>
              <h3 className="text-xl font-black text-gray-900">Chưa có thông báo</h3>
              <p className="text-sm font-bold text-gray-500 mt-2">Booking, payment và KYC cần xử lý sẽ xuất hiện ở đây.</p>
            </div>
          )}

          {!loading && !errorMessage && notifications.length > 0 && (
            <div className="divide-y divide-gray-50">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-5 flex items-start gap-4 transition-colors ${
                    notification.isRead ? 'bg-white hover:bg-gray-50' : 'bg-[#f4f8f7]/80 hover:bg-[#f4f8f7]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleOpen(notification)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-2 w-2.5 h-2.5 rounded-full shrink-0 ${notification.isRead ? 'bg-gray-200' : 'bg-[#78ad44]'}`} />
                      <div className="min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                          <h3 className="text-sm font-black text-gray-900">{notification.title}</h3>
                          <span className="w-fit rounded-lg bg-white border border-gray-100 px-2.5 py-1 text-[11px] font-black text-gray-400">
                            {notification.type}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-gray-600 mt-2 leading-relaxed">
                          {getNotificationBody(notification)}
                        </p>
                        <p className="text-xs font-bold text-gray-400 mt-3">{formatDateTime(notification.createdAt)}</p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(notification.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                    aria-label="Xóa thông báo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
