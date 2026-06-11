import api from './api';
import type { Notification, NotificationUnreadCountResponse } from '@/types';

export const getMyNotifications = (params?: { unreadOnly?: boolean }) =>
  api.get<Notification[]>('/notifications', { params });

export const getUnreadNotificationCount = () =>
  api.get<NotificationUnreadCountResponse>('/notifications/unread-count');

export const markNotificationRead = (id: string | number) =>
  api.patch<Notification>(`/notifications/${id}/read`);

export const markAllNotificationsRead = () =>
  api.patch('/notifications/read-all');

export const deleteNotification = (id: string | number) =>
  api.delete(`/notifications/${id}`);
