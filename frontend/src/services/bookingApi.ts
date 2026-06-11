import api from './api';
import type {
  AdminBookingTransitionPayload,
  AdminDashboardMonthlyStats,
  AdminDashboardOverview,
  ApiBookingResponse,
  ApiBookingStatus,
  BackendCreateBookingRequest,
} from '@/types';

interface AdminBookingQuery {
  status?: ApiBookingStatus;
  vehicleId?: number;
  userId?: number;
  from?: string;
  to?: string;
}

export const createBooking = (payload: BackendCreateBookingRequest) => {
  return api.post<ApiBookingResponse>('/bookings', payload);
};

export const getMyBookings = () => {
  return api.get<ApiBookingResponse[]>('/bookings/my');
};

export const getMyBooking = (id: number | string) => {
  return api.get<ApiBookingResponse>(`/bookings/${id}`);
};

export const cancelMyBooking = (id: number | string) => {
  return api.post<ApiBookingResponse>(`/bookings/${id}/cancel`);
};

export const getAdminBookings = (params: AdminBookingQuery = {}) => {
  return api.get<ApiBookingResponse[]>('/admin/bookings', { params });
};

export const getAdminBooking = (id: number | string) => {
  return api.get<ApiBookingResponse>(`/admin/bookings/${id}`);
};

export const transitionAdminBooking = (
  id: number | string,
  payload: AdminBookingTransitionPayload,
) => {
  return api.post<ApiBookingResponse>(`/admin/bookings/${id}/transition`, payload);
};

export const confirmBookingForTest = (id: number | string) => {
  return api.post<ApiBookingResponse>(`/bookings/${id}/confirm-for-test`);
};

export const getAdminMonthlyDashboard = () => {
  return api.get<AdminDashboardMonthlyStats[]>('/admin/dashboard/monthly');
};

export const getAdminDashboardOverview = () => {
  return api.get<AdminDashboardOverview>('/admin/dashboard/overview');
};
