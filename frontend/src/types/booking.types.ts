// ============================================================
// Booking Types — B2C Model
// ============================================================

export type BookingStatus = 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Booking {
  id: string;
  bookingCode: string;              // RC-20240315-A1B2
  customerId: string;
  vehicleId: string;
  pickupLocationId: string;
  returnLocationId: string;
  startDatetime: string;            // TIMESTAMPTZ
  endDatetime: string;
  actualReturnAt?: string;          // thực tế trả xe
  totalDays: number;
  baseAmount: number;               // snapshot giá khi đặt
  discountAmount: number;           // giảm giá (coupon + điểm)
  extraAmount: number;              // phí phát sinh (trả muộn, xăng...)
  totalAmount: number;              // = base - discount + extra
  depositAmount: number;            // snapshot tiền cọc khi đặt
  status: BookingStatus;
  promotionId?: string;
  staffCheckinId?: string;
  staffCheckoutId?: string;
  customerNote?: string;
  internalNote?: string;
  cancelledAt?: string;
  cancelReason?: string;
  version: number;                  // optimistic lock
  createdAt: string;
}

// Bảng checkin_reports — biên bản giao/nhận xe
export type ReportType = 'CHECKIN' | 'CHECKOUT';

export interface CheckinReport {
  id: string;
  bookingId: string;
  reportType: ReportType;
  staffId: string;
  odometer: number;                 // km đồng hồ
  fuelLevel: number;                // 0–100%
  conditionNotes?: string;
  damageFound: boolean;
  imageUrls: string[];              // mảng ảnh xe
  customerSigned: boolean;
  reportedAt: string;
}

// B2C Booking status — label & màu
export const BOOKING_STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; color: 'blue' | 'green' | 'gray' | 'red' | 'yellow' }
> = {
  CONFIRMED: { label: 'Đã xác nhận', color: 'blue' },
  ACTIVE:    { label: 'Đang thuê',   color: 'green' },
  COMPLETED: { label: 'Hoàn thành',  color: 'gray' },
  CANCELLED: { label: 'Đã hủy',      color: 'red' },
  NO_SHOW:   { label: 'Không đến',   color: 'yellow' },
};

// ---- Request types ----
export interface CreateBookingRequest {
  vehicleId: string;
  pickupLocationId: string;
  returnLocationId: string;
  startDatetime: string;
  endDatetime: string;
  promotionCode?: string;
  customerNote?: string;
  idempotencyKey: string;           // UUID do FE tạo
}

export interface CheckinRequest {
  odometer: number;
  fuelLevel: number;
  conditionNotes?: string;
  imageUrls: string[];
}

export interface CheckoutRequest extends CheckinRequest {
  damageFound: boolean;
  extraCharge?: number;
  extraNote?: string;
}
