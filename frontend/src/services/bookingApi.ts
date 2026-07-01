import api from './api';
import type {
  AdminBookingTransitionPayload,
  AdminDashboardMonthlyStats,
  AdminDashboardOverview,
  ApiBookingResponse,
  ApiBookingStatus,
  BackendCreateBookingRequest,
  RentalContractResponse,
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

export const cancelAdminBooking = (id: number | string) => {
  return api.post<ApiBookingResponse>(`/admin/bookings/${id}/cancel`);
};

export const prepareSecurityDeposit = (
  id: number | string,
  method: 'PAYMENT_REQUEST' | 'CASH',
) => {
  return api.post<ApiBookingResponse>(`/admin/bookings/${id}/security-deposit`, { method });
};

export interface HandoverContractPayload {
  actualHandoverAt: string;
  condition: 'GOOD' | 'DAMAGE';
  damageFound: boolean;
  notes?: string;
  keyCount: number;
  accessories?: string;
  files: File[];
  customerSignature: File;
  staffSignature: File;
}

export interface ReturnConditionPayload {
  condition: 'GOOD' | 'DAMAGE' | 'NEED_MAINTENANCE';
  actualReturnAt: string;
  damageFound: boolean;
  damageSeverity?: 'MINOR' | 'MODERATE' | 'MAJOR';
  damageDescription?: string;
  notes?: string;
  keyCount: number;
  accessories?: string;
  files: File[];
  customerSignature: File;
  staffSignature: File;
  finalPaymentMethod: 'PAYMENT_REQUEST' | 'CASH';
  securityDepositRefundMethod?: 'PAYMENT_REQUEST' | 'CASH';
}

export const saveHandoverContract = (
  id: number | string,
  payload: HandoverContractPayload,
) => {
  const formData = new FormData();
  formData.append('handover', new Blob([JSON.stringify({
    actualHandoverAt: payload.actualHandoverAt,
    condition: payload.condition,
    damageFound: payload.damageFound,
    notes: payload.notes?.trim() || undefined,
    keyCount: payload.keyCount,
    accessories: payload.accessories?.trim() || undefined,
  })], { type: 'application/json' }));
  payload.files.forEach((file) => formData.append('files', file));
  formData.append('customerSignature', payload.customerSignature);
  formData.append('staffSignature', payload.staffSignature);
  return api.post<RentalContractResponse>(`/admin/bookings/${id}/handover`, formData);
};

export const saveReturnCondition = (
  id: number | string,
  payload: ReturnConditionPayload,
) => {
  const formData = new FormData();
  formData.append('return', new Blob([JSON.stringify({
    condition: payload.condition,
    actualReturnAt: payload.actualReturnAt,
    damageFound: payload.damageFound,
    damageSeverity: payload.damageSeverity,
    damageDescription: payload.damageDescription?.trim() || undefined,
    notes: payload.notes?.trim() || undefined,
    keyCount: payload.keyCount,
    accessories: payload.accessories?.trim() || undefined,
    finalPaymentMethod: payload.finalPaymentMethod,
    securityDepositRefundMethod: payload.securityDepositRefundMethod,
  })], { type: 'application/json' }));
  payload.files.forEach((file) => formData.append('files', file));
  formData.append('customerSignature', payload.customerSignature);
  formData.append('staffSignature', payload.staffSignature);
  return api.post<RentalContractResponse>(`/admin/bookings/${id}/return`, formData);
};

export const getRentalContract = (bookingId: number | string) =>
  api.get<RentalContractResponse>(`/bookings/${bookingId}/contract`);

export const downloadRentalContractPdf = (bookingId: number | string) =>
  api.get<Blob>(`/bookings/${bookingId}/contract/pdf`, { responseType: 'blob' });

export const finalizeDamageAssessment = (
  id: number | string,
  payload: { actualFee: number },
) => {
  return api.post<ApiBookingResponse>(`/admin/bookings/${id}/damage-assessment/finalize`, payload);
};

export interface ResolveRetainedSecurityDepositPayload {
  actualRepairCost: number;
  refundMethod?: 'PAYMENT_REQUEST' | 'CASH';
}

export const resolveRetainedSecurityDeposit = (
  id: number | string,
  payload: ResolveRetainedSecurityDepositPayload,
) => api.post<RentalContractResponse>(`/admin/bookings/${id}/security-deposit/resolve`, payload);

export const confirmBookingForTest = (id: number | string) => {
  return api.post<ApiBookingResponse>(`/bookings/${id}/confirm-for-test`);
};

export const getAdminMonthlyDashboard = () => {
  return api.get<AdminDashboardMonthlyStats[]>('/admin/dashboard/monthly');
};

export const getAdminDashboardOverview = () => {
  return api.get<AdminDashboardOverview>('/admin/dashboard/overview');
};
