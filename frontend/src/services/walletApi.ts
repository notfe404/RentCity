import api from './api';
import type {
  ApiPaymentResponse,
  ApiWithdrawalRequest,
  ApiWalletResponse,
  CreateDamagePaymentPayload,
  CreateWithdrawalPayload,
  CreateWalletTopUpPayload,
} from '@/types';

export const getMyWallet = () => api.get<ApiWalletResponse>('/wallet/me');

export const createWalletTopUp = (payload: CreateWalletTopUpPayload) =>
  api.post<ApiPaymentResponse>('/wallet/top-ups', payload);

export const createBookingPayment = (
  bookingId: number | string,
  payload: CreateDamagePaymentPayload,
) => api.post<ApiPaymentResponse>(`/wallet/bookings/${bookingId}/payments`, payload);

export const createWithdrawalRequest = (payload: CreateWithdrawalPayload) =>
  api.post<ApiWithdrawalRequest>('/wallet/withdrawals', payload);

export const getMyWithdrawalRequests = () =>
  api.get<ApiWithdrawalRequest[]>('/wallet/withdrawals');
