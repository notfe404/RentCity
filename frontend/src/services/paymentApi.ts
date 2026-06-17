import api from './api';
import type { ApiPaymentResponse, CreateDepositPaymentPayload } from '@/types';

export const createDepositPayment = (payload: CreateDepositPaymentPayload) => {
  return api.post<ApiPaymentResponse>('/payments/deposit', payload);
};

export const getMyPayments = () => {
  return api.get<ApiPaymentResponse[]>('/payments/me');
};

export const capturePaypalPayment = (id: number | string, gatewayTransactionId?: string) => {
  return api.post<ApiPaymentResponse>(`/payments/paypal/${id}/capture`, {
    gatewayTransactionId: gatewayTransactionId ?? `PAYPAL-FE-${Date.now()}`,
  });
};

export const completeVnpayMockCallback = (reference: string) => {
  return api.get<ApiPaymentResponse>('/payments/vnpay/callback', {
    params: {
      reference,
      vnp_ResponseCode: '00',
      vnp_TransactionNo: `VNPAY-FE-${Date.now()}`,
    },
  });
};

export const refundPayment = (id: number | string) => {
  return api.post<ApiPaymentResponse>(`/payments/${id}/refund`);
};

export const downloadBookingInvoicePdf = (bookingId: number | string) => {
  return api.get<Blob>(`/invoices/${bookingId}/pdf`, {
    responseType: 'blob',
  });
};
