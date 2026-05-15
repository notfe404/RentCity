// ============================================================
// Payment, Promotion, Review, Notification Types — B2C
// ============================================================

// ---- Payments ----
export type PaymentType = 'DEPOSIT' | 'FULL' | 'EXTRA_CHARGE' | 'REFUND';
export type PaymentGateway = 'VNPAY' | 'MOMO' | 'ZALOPAY' | 'CASH' | 'BANK_TRANSFER';
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

export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: 'yellow' | 'green' | 'red' | 'gray' }
> = {
  PENDING:  { label: 'Chờ thanh toán', color: 'yellow' },
  PAID:     { label: 'Đã thanh toán',  color: 'green' },
  FAILED:   { label: 'Thất bại',       color: 'red' },
  REFUNDED: { label: 'Đã hoàn tiền',   color: 'gray' },
  EXPIRED:  { label: 'Hết hạn',        color: 'gray' },
};

// ---- Promotions & Coupons ----
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;            // % hoặc VND
  maxDiscount?: number;             // giảm tối đa
  minOrderValue?: number;           // đơn tối thiểu
  usageLimit?: number;
  usagePerUser: number;             // mỗi user dùng được mấy lần
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface CouponUsage {
  id: string;
  promotionId: string;
  userId: string;
  bookingId: string;
  discountApplied: number;          // số tiền thực tế được giảm
  usedAt: string;
}

// Response khi validate coupon code
export interface CouponValidateResponse {
  valid: boolean;
  promotion?: Promotion;
  discountAmount?: number;          // số tiền sẽ được giảm
  message?: string;
}

// ---- Reviews ----
export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  vehicleId: string;
  overallRating: number;            // 1–5
  vehicleRating: number;            // rating tình trạng xe
  serviceRating: number;            // rating phục vụ nhân viên
  comment?: string;
  isVisible: boolean;
  staffReply?: string;              // phản hồi công ty
  repliedBy?: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  bookingId: string;
  vehicleId: string;
  overallRating: number;
  vehicleRating: number;
  serviceRating: number;
  comment?: string;
}

// ---- Notifications ----
export type NotificationType =
  | 'BOOKING_CONFIRMED'
  | 'CHECKIN_REMINDER'
  | 'CHECKOUT_REMINDER'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'BOOKING_CANCELLED'
  | 'PROMOTION_NEW'
  | 'REVIEW_REQUEST';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;    // { booking_id, vehicle_id } để FE điều hướng
  isRead: boolean;
  createdAt: string;
}
