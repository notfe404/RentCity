import api from './api';
import type { Notification } from '@/types';

export const getMyNotifications = () =>
  api.get<Notification[]>('/notifications');

export const markNotificationRead = (id: string | number) =>
  api.patch<Notification>(`/notifications/${id}/read`);

export const markAllNotificationsRead = () =>
  api.patch('/notifications/read-all');

export const deleteNotification = (id: string | number) =>
  api.delete(`/notifications/${id}`);
