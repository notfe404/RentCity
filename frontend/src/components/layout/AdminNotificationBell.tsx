import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notificationApi';
import type { Notification } from '@/types';
import { formatDateTime } from '@/utils/formatters';

const POLL_INTERVAL_MS = 60000;

function getNotificationBody(notification: Notification) {
  return notification.body ?? notification.message ?? '';
}

function getNotificationTarget(notification: Notification) {
  const targetUrl = notification.data?.targetUrl;
  if (typeof targetUrl === 'string' && targetUrl) {
    return targetUrl;
  }
  return '/admin/notifications';
}

export default function AdminNotificationBell() {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);
  const recentNotifications = notifications.slice(0, 5);

  const loadNotifications = async () => {
    try {
      const { data } = await getMyNotifications();
      setNotifications(data);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const { data } = await getMyNotifications();
        if (!cancelled) setNotifications(data);
      } catch {
        if (!cancelled) setNotifications([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    const timer = window.setInterval(run, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleToggle = () => {
    setOpen((cur) => !cur);
    if (!open) {
      void loadNotifications();
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification.id);
      } catch {
        // Keep the admin moving; the next poll will restore server truth if needed.
      }
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() } : n
        )
      );
    }

    setOpen(false);
    navigate(getNotificationTarget(notification));
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
    } catch {
      // Optimistic update.
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative text-gray-400 hover:text-[#78ad44] transition-colors p-2"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-[min(22rem,calc(100vw-2rem))] bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-gray-900">Notifications</p>
              <p className="text-xs font-bold text-gray-400">{unreadCount} unread</p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1.5 text-xs font-black text-[#78ad44] hover:text-[#689938]"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="py-10 flex items-center justify-center">
                <Loader2 size={22} className="animate-spin text-[#78ad44]" />
              </div>
            )}

            {!loading && recentNotifications.length === 0 && (
              <div className="py-10 px-5 text-center">
                <Bell size={30} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-black text-gray-900">No notifications yet</p>
                <p className="text-xs font-bold text-gray-400 mt-1">Items that need attention will appear here.</p>
              </div>
            )}

            {!loading && recentNotifications.map((notification) => (
              <button
                type="button"
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left p-4 border-b border-gray-50 hover:bg-[#f4f8f7] transition-colors ${
                  notification.isRead ? 'bg-white' : 'bg-[#f4f8f7]/70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notification.isRead ? 'bg-gray-200' : 'bg-[#78ad44]'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate">{notification.title}</p>
                    <p className="text-xs font-bold text-gray-500 line-clamp-2 mt-1">
                      {getNotificationBody(notification)}
                    </p>
                    <p className="text-[11px] font-bold text-gray-400 mt-2">{formatDateTime(notification.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate('/admin/notifications');
            }}
            className="w-full p-4 text-sm font-black text-[#78ad44] hover:bg-[#f4f8f7] transition-colors"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
