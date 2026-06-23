import type { PaymentGateway } from './payment.types';

export type WalletTransactionType =
  | 'TOP_UP'
  | 'BOOKING_HOLD'
  | 'BALANCE_PAYMENT'
  | 'HOLD_RELEASE'
  | 'FORFEITURE'
  | 'OVERDUE_CHARGE'
  | 'DAMAGE_CHARGE'
  | 'REFUND_CREDIT'
  | 'WITHDRAWAL_REQUEST'
  | 'WITHDRAWAL_REVERSED'
  | 'ADJUSTMENT'
  | 'DAMAGE_FEE_REFUND'
  | 'RESERVATION_FEE'
  | 'SECURITY_DEPOSIT_CASH_REFUND'
  | 'SECURITY_DEPOSIT_RETAINED'
  | 'FINAL_RENTAL_PAYMENT';

export interface ApiWalletTransaction {
  id: number;
  bookingId?: number | null;
  type: WalletTransactionType;
  amount: number;
  availableDelta: number;
  heldDelta: number;
  availableBalanceAfter: number;
  heldBalanceAfter: number;
  reference: string;
  description?: string;
  createdAt: string;
}

export interface ApiWalletResponse {
  id: number;
  availableBalance: number;
  heldBalance: number;
  totalBalance: number;
  currency: string;
  transactions: ApiWalletTransaction[];
}

export interface CreateWalletTopUpPayload {
  amount: number;
  gateway: PaymentGateway;
  idempotencyKey?: string;
}

export interface CreateDamagePaymentPayload {
  gateway: PaymentGateway;
  idempotencyKey?: string;
}

export type WithdrawalRequestStatus = 'PENDING' | 'COMPLETED' | 'REJECTED';

export interface ApiWithdrawalRequest {
  id: number;
  userId: number;
  customerName?: string;
  customerEmail?: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  status: WithdrawalRequestStatus;
  rejectionReason?: string | null;
  processedBy?: number | null;
  processedAt?: string | null;
  createdAt: string;
}

export interface CreateWithdrawalPayload {
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}
