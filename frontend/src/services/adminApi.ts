import api from './api';
import type { ApiWithdrawalRequest, WithdrawalRequestStatus } from '@/types';

// ---- Types ----
export interface ApiBranch {
  id: number;
  name: string;
  address: string;
  city: string;
  phone?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface ApiCategory {
  id: number;
  name: string;
  description?: string;
  basePriceDay: number;
  depositRate: number;
  isActive: boolean;
}

export interface ApiAdminUser {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
  isActive: boolean;
  createdAt: string;
}

export interface ApiAdminPayment {
  id: number;
  bookingId: number;
  bookingCode?: string;
  userId: number;
  customerName?: string;
  customerEmail?: string;
  type: string;
  gateway: string;
  status: string;
  amount: number;
  currency: string;
  gatewayReference?: string;
  gatewayTransactionId?: string;
  failureReason?: string;
  paidAt?: string;
  refundedAt?: string;
  createdAt: string;
}

// ---- Branches ----
export const getBranches = () => api.get<ApiBranch[]>('/branches');

export const adminCreateBranch = (data: Omit<ApiBranch, 'id' | 'createdAt'>) =>
  api.post<ApiBranch>('/admin/branches', data);

export const adminUpdateBranch = (id: number, data: Partial<Omit<ApiBranch, 'id' | 'createdAt'>>) =>
  api.put<ApiBranch>(`/admin/branches/${id}`, data);

export const adminDeleteBranch = (id: number) =>
  api.delete(`/admin/branches/${id}`);

// ---- Categories ----
export const getCategories = () => api.get<ApiCategory[]>('/categories');

export const adminCreateCategory = (data: Omit<ApiCategory, 'id'>) =>
  api.post<ApiCategory>('/admin/categories', data);

export const adminUpdateCategory = (id: number, data: Partial<Omit<ApiCategory, 'id'>>) =>
  api.put<ApiCategory>(`/admin/categories/${id}`, data);

export const adminDeleteCategory = (id: number) =>
  api.delete(`/admin/categories/${id}`);

// ---- Users ----
export const adminGetUsers = (params?: { role?: string; keyword?: string; page?: number; size?: number }) =>
  api.get<ApiAdminUser[]>('/admin/users', { params });

export const adminToggleUserStatus = (id: number) =>
  api.patch<ApiAdminUser>(`/admin/users/${id}/toggle-status`);

// ---- Admin Payments ----
export const adminGetPayments = (params?: { status?: string; gateway?: string; from?: string; to?: string }) =>
  api.get<ApiAdminPayment[]>('/admin/payments', { params });

export const adminRefundPayment = (id: number) =>
  api.post<ApiAdminPayment>(`/admin/payments/${id}/refund`);

export const adminGetWithdrawalRequests = (status?: WithdrawalRequestStatus) =>
  api.get<ApiWithdrawalRequest[]>('/admin/withdrawals', { params: status ? { status } : {} });

export const adminCompleteWithdrawalRequest = (id: number) =>
  api.post<ApiWithdrawalRequest>(`/admin/withdrawals/${id}/complete`);

export const adminRejectWithdrawalRequest = (id: number, reason: string) =>
  api.post<ApiWithdrawalRequest>(`/admin/withdrawals/${id}/reject`, { reason });
