import { MOCK_VEHICLES } from '@/data/mockVehicles';
import type { ApiBookingResponse, ApiBookingStatus, ApiDepositStatus } from '@/types';
import { getRentalDurationParts } from '@/utils/bookingDateTime';

export const BOOKING_STATUS_META: Record<ApiBookingStatus, { label: string; bg: string; color: string }> = {
  PENDING: { label: 'Chờ xác nhận', bg: 'bg-orange-500', color: 'text-orange-600' },
  CONFIRMED: { label: 'Đã xác nhận', bg: 'bg-[#78ad44]', color: 'text-[#78ad44]' },
  PAID: { label: 'Đã thu cọc xe', bg: 'bg-emerald-600', color: 'text-emerald-600' },
  ONGOING: { label: 'Đang thuê', bg: 'bg-blue-600', color: 'text-blue-600' },
  COMPLETED: { label: 'Hoàn thành', bg: 'bg-gray-700', color: 'text-gray-500' },
  CANCELLED: { label: 'Đã hủy', bg: 'bg-red-500', color: 'text-red-500' },
};

export const DEPOSIT_STATUS_META: Record<ApiDepositStatus, { label: string; color: string }> = {
  UNPAID: { label: 'Chưa thanh toán phí giữ chỗ', color: 'text-yellow-500' },
  PAID: { label: 'Đã thanh toán phí giữ chỗ', color: 'text-[#78ad44]' },
  FORFEITED: { label: 'Phí giữ chỗ không hoàn lại', color: 'text-red-500' },
  REFUNDED: { label: 'Đã hoàn phí giữ chỗ', color: 'text-gray-500' },
  NOT_REQUIRED: { label: 'Không yêu cầu phí giữ chỗ', color: 'text-gray-500' },
};

export function getBookingTotalDays(booking: ApiBookingResponse): number {
  const start = new Date(booking.startTime).getTime();
  const end = new Date(booking.endTime).getTime();
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
}

export function getBookingTotalHours(booking: ApiBookingResponse): number {
  const start = new Date(booking.startTime).getTime();
  const end = new Date(booking.endTime).getTime();
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
}

export function getBookingDurationLabel(booking: ApiBookingResponse): string {
  if (booking.pricingMode === 'HOURLY') {
    return `${getBookingTotalHours(booking)} giờ`;
  }

  const { fullDays, remainingHours } = getRentalDurationParts(booking.startTime, booking.endTime);
  const parts = [];
  if (fullDays > 0) {
    parts.push(`${fullDays} ngày`);
  }
  if (remainingHours > 0) {
    parts.push(`${remainingHours} giờ`);
  }
  return parts.join(' ');
}

export function getBookingVehicleFallback(booking: ApiBookingResponse) {
  return MOCK_VEHICLES.find((vehicle) => Number(vehicle.id) === booking.vehicleId) ?? null;
}

export function getBookingVehicleName(booking: ApiBookingResponse): string {
  return booking.vehicleName ?? getBookingVehicleFallback(booking)?.name ?? `Xe #${booking.vehicleId}`;
}

export function getBookingVehicleImage(booking: ApiBookingResponse): string | undefined {
  return booking.vehiclePrimaryImageUrl ?? getBookingVehicleFallback(booking)?.image;
}

export function isBookingCancellable(booking: ApiBookingResponse): boolean {
  return booking.status === 'PENDING' || booking.status === 'CONFIRMED' || booking.status === 'PAID';
}
