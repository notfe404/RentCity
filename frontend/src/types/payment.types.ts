// Payment, promotion, review, and notification types.

// ---- Payments ----
export type PaymentType = 'DEPOSIT' | 'SECURITY_DEPOSIT' | 'SECURITY_DEPOSIT_REFUND' | 'FINAL_RENTAL_PAYMENT' | 'WALLET_TOP_UP' | 'DAMAGE_PAYMENT' | 'BALANCE_PAYMENT' | 'FULL' | 'EXTRA_CHARGE' | 'REFUND';
export type PaymentGateway = 'PAYPAL' | 'VNPAY' | 'WALLET' | 'CASH';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'EXPIRED';

export interface Payment {
  id: string;
  bookingId: string;
  customerId: string;
  type: PaymentType;
  amount: number;
  gateway: PaymentGateway;
  gatewayTxnId?: string;
  idempotencyKey: string;
  status: PaymentStatus;
  paidAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface ApiPaymentResponse {
  id: number;
  bookingId?: number | null;
  bookingCode?: string;
  userId: number;
  type: PaymentType;
  gateway: PaymentGateway;
  status: PaymentStatus;
  amount: number;
  currency: string;
  gatewayReference: string;
  gatewayTransactionId?: string;
  paymentUrl?: string;
  failureReason?: string;
  paidAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepositPaymentPayload {
  bookingId: number;
  gateway: PaymentGateway;
  idempotencyKey?: string;
}

export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: 'yellow' | 'green' | 'red' | 'gray' }
> = {
  PENDING: { label: 'Pending Payment', color: 'yellow' },
  PAID: { label: 'Paid', color: 'green' },
  FAILED: { label: 'Failed', color: 'red' },
  REFUNDED: { label: 'Refunded', color: 'gray' },
  EXPIRED: { label: 'Expired', color: 'gray' },
};

// ---- Promotions & Coupons ----
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number;
  minOrderValue?: number;
  usageLimit?: number;
  usagePerUser: number;
  usedCount: number;
  bagsdFrom: string;
  bagsdUntil: string;
  isActive: boolean;
}

export interface CouponUsage {
  id: string;
  promotionId: string;
  userId: string;
  bookingId: string;
  discountApplied: number;
  usedAt: string;
}

export interface CouponValidateResponse {
  bagsd: boolean;
  promotion?: Promotion;
  discountAmount?: number;
  message?: string;
}

// ---- Reviews ----
  export interface Review {
  id: string | number;
  bookingId: string | number;
  bookingCode?: string;
  customerId?: string;
  userId?: number;
  customerName?: string;
  customerEmail?: string;
  vehicleId: string | number;
  vehicleName?: string;
  vehicleLicensePlate?: string;
  overallRating: number;
  vehicleRating: number;
  serviceRating: number;
  comment?: string;
  isVisible: boolean;
  staffReply?: string;
  repliedBy?: string | number;
  repliedByName?: string;
  createdAt: string;
    updatedAt?: string;
  }

  export interface PublicReview {
    id: string | number;
    customerName?: string;
    overallRating: number;
    vehicleRating: number;
    serviceRating: number;
    comment?: string;
    staffReply?: string;
    repliedByName?: string;
    createdAt: string;
  }

  export interface CarReviewsResponse {
    content: PublicReview[];
    page: number;
    size: number;
    totalElements: number;
    reviewCount: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    averageRating: number;
    ratingCounts: Record<number, number>;
  }

export interface CreateReviewRequest {
  bookingId: number;
  vehicleId: number;
  overallRating: number;
  vehicleRating: number;
  serviceRating: number;
  comment?: string;
}

// ---- Notifications ----
export type NotificationType =
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_ONGOING'
  | 'BOOKING_COMPLETED'
  | 'CHECKIN_REMINDER'
  | 'CHECKOUT_REMINDER'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_PAID'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_EXPIRED'
  | 'BOOKING_CANCELLED'
  | 'KYC_PENDING'
  | 'SYSTEM'
  | 'PROMOTION_NEW'
  | 'REVIEW_REQUEST';

export type NotificationAudience = 'USER' | 'ADMIN' | 'STAFF' | 'ADMIN_AND_STAFF';

export interface Notification {
  id: string | number;
  userId?: string;
  recipientUserId?: number;
  audience?: NotificationAudience;
  type: NotificationType;
  title: string;
  message?: string;
  body?: string;
  data?: Record<string, string | number | undefined>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationUnreadCountResponse {
  count: number;
}
