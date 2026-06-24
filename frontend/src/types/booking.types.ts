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

// ============================================================
// Backend Booking API Types
// ============================================================
import type { ApiCarConditionResponse } from './vehicle.types';

export type ApiBookingStatus = 'PENDING' | 'CONFIRMED' | 'PAID' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type ApiPricingMode = 'HOURLY' | 'DAILY' | 'MONTHLY';
export type ApiVehiclePickupMethod = 'BRANCH_PICKUP' | 'ADDRESS_DELIVERY';
export type ApiDepositStatus = 'UNPAID' | 'PAID' | 'FORFEITED' | 'REFUNDED' | 'NOT_REQUIRED';
export type ApiSecurityDepositStatus = 'UNPAID' | 'PAYMENT_REQUESTED' | 'PAID' | 'RETAINED' | 'REFUNDED';
export type ApiFinalPaymentStatus = 'NOT_DUE' | 'PAYMENT_REQUESTED' | 'PAID';
export type SettlementMethod = 'PAYMENT_REQUEST' | 'CASH';
export type DamageSeverity = 'MINOR' | 'MODERATE' | 'MAJOR';
export type DamageAssessmentStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CHARGED'
  | 'PARTIALLY_CHARGED'
  | 'RESOLVED';

export interface ApiDamageAssessment {
  id: number;
  bookingId: number;
  description: string;
  severity: DamageSeverity;
  estimatedFee: number;
  approvedFee: number;
  chargedFee: number;
  outstandingFee: number;
  actualFee?: number;
  refundedFee?: number;
  status: DamageAssessmentStatus;
  assessedBy: number;
  approvedBy?: number | null;
  approvedAt?: string | null;
  createdAt: string;
}

export interface ApiBookingResponse {
  id: number;
  bookingCode: string;
  vehicleId: number;
  userId: number;
  vehicleName?: string;
  vehicleLicensePlate?: string;
  vehiclePrimaryImageUrl?: string;
  vehiclePricePerDay?: number;
  customerName?: string;
  customerEmail?: string;
  startTime: string;
  endTime: string;
  pickupMethod: ApiVehiclePickupMethod;
  deliveryAddress?: string | null;
  pricingMode: ApiPricingMode;
  status: ApiBookingStatus;
  depositStatus: ApiDepositStatus;
  baseAmount: number;
  insuranceSelected: boolean;
  childSeatQuantity: number;
  gpsSelected: boolean;
  extraServicesAmount: number;
  deliveryFeeAmount: number;
  depositAmount: number;
  reservationFeeStatus: ApiDepositStatus;
  reservationFeeAmount: number;
  securityDepositAmount: number;
  securityDepositStatus: ApiSecurityDepositStatus;
  securityDepositPaidAmount: number;
  securityDepositCollectionMethod?: SettlementMethod | null;
  securityDepositPaidAt?: string | null;
  securityDepositRefundMethod?: SettlementMethod | null;
  securityDepositResolvedAt?: string | null;
  finalRentalAmount: number;
  finalPaymentStatus: ApiFinalPaymentStatus;
  finalPaymentMethod?: SettlementMethod | null;
  finalPaidAt?: string | null;
  totalAmount: number;
  freeCancelUntil: string;
  paymentExpiresAt: string;
  actualReturnAt?: string | null;
  actualHandoverAt?: string | null;
  overdueMinutes: number;
  overdueFee: number;
  penaltyOverdueFee: number;
  totalOverdueFee: number;
  damageFee: number;
  outstandingAmount: number;
  damageAssessment?: ApiDamageAssessment | null;
  cancelledAt?: string;
  cancelReason?: string;
  cancelledBy?: string;
  initialCondition?: ApiCarConditionResponse | null;
  returnCondition?: ApiCarConditionResponse | null;
  createdAt: string;
  updatedAt: string;
}

export type RentalContractStatus = 'HANDOVER_DRAFT' | 'ACTIVE' | 'RETURN_DRAFT' | 'COMPLETED';

export interface RentalContractResponse {
  id: number;
  bookingId: number;
  contractNumber: string;
  policyVersion: string;
  policyText: string;
  status: RentalContractStatus;
  handoverAt: string;
  handoverKeyCount: number;
  handoverAccessories?: string | null;
  handoverCustomerSignature: string;
  handoverCustomerSignedAt: string;
  handoverStaffSignature: string;
  handoverStaffUserId: number;
  handoverStaffSignedAt: string;
  handoverCondition: ApiCarConditionResponse;
  securityDepositAmount: number;
  securityDepositCollectionMethod: SettlementMethod;
  securityDepositPaidAt: string;
  returnKeyCount?: number | null;
  returnAccessories?: string | null;
  returnCustomerSignature?: string | null;
  returnCustomerSignedAt?: string | null;
  returnStaffSignature?: string | null;
  returnStaffUserId?: number | null;
  returnStaffSignedAt?: string | null;
  returnCondition?: ApiCarConditionResponse | null;
  securityDepositStatus?: ApiSecurityDepositStatus | null;
  securityDepositRefundMethod?: SettlementMethod | null;
  securityDepositResolvedAt?: string | null;
  finalRentalAmount?: number | null;
  finalPaymentMethod?: SettlementMethod | null;
  finalPaymentStatus?: ApiFinalPaymentStatus | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendCreateBookingRequest {
  vehicleId: number;
  startTime: string;
  endTime: string;
  pricingMode: ApiPricingMode;
  pickupMethod: ApiVehiclePickupMethod;
  deliveryAddress?: string;
  insuranceSelected?: boolean;
  childSeatQuantity?: number;
  gpsSelected?: boolean;
}

export interface AdminBookingTransitionPayload {
  targetStatus: Exclude<ApiBookingStatus, 'PENDING'>;
  reason?: string;
  note?: string;
}

export interface AdminDashboardHotVehicle {
  vehicleId: number;
  vehicleName: string;
  licensePlate?: string | null;
  bookingCount: number;
}

export interface AdminDashboardMonthlyStats {
  month: string;
  totalBookings: number;
  completedRevenue: number;
  hotVehicle?: AdminDashboardHotVehicle | null;
}

export interface AdminDashboardBookingOperations {
  pendingBookings: number;
  confirmedPickupsToday: number;
  ongoingBookings: number;
  returnsToday: number;
}

export interface AdminDashboardFleetStatus {
  totalCars: number;
  availableCars: number;
  maintenanceCars: number;
  retiredCars: number;
  carsWithoutImages: number;
}

export interface AdminDashboardPaymentStatus {
  pendingPayments: number;
  paidPayments: number;
  failedPayments: number;
  refundedPayments: number;
  expiredPayments: number;
}

export interface AdminDashboardRecentBooking {
  id: number;
  bookingCode: string;
  vehicleId: number;
  vehicleName?: string;
  vehicleLicensePlate?: string | null;
  userId: number;
  customerName?: string | null;
  customerEmail?: string | null;
  status: ApiBookingStatus;
  depositStatus: ApiDepositStatus;
  totalAmount: number;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface AdminDashboardOverview {
  bookingOperations: AdminDashboardBookingOperations;
  fleetStatus: AdminDashboardFleetStatus;
  paymentStatus: AdminDashboardPaymentStatus;
  totalBookingsLast12Months: number;
  cancelledBookingsLast12Months: number;
  cancellationRate: number;
  pendingKycUsers: number;
  recentBookings: AdminDashboardRecentBooking[];
}
