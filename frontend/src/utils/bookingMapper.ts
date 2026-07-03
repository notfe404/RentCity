import { MOCK_VEHICLES } from '@/data/mockVehicles';
import type { ApiBookingResponse, ApiBookingStatus, ApiDepositStatus } from '@/types';
import { getRentalDurationParts } from '@/utils/bookingDateTime';

export const BOOKING_STATUS_META: Record<ApiBookingStatus, { label: string; bg: string; color: string }> = {
  PENDING: { label: 'Pending Confirmation', bg: 'bg-orange-500', color: 'text-orange-600' },
  CONFIRMED: { label: 'Confirmed', bg: 'bg-[#78ad44]', color: 'text-[#78ad44]' },
  PAID: { label: 'Ready for Handover', bg: 'bg-emerald-600', color: 'text-emerald-600' },
  ONGOING: { label: 'Ongoing', bg: 'bg-blue-600', color: 'text-blue-600' },
  COMPLETED: { label: 'Completed', bg: 'bg-gray-700', color: 'text-gray-500' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-500', color: 'text-red-500' },
};

export const DEPOSIT_STATUS_META: Record<ApiDepositStatus, { label: string; color: string }> = {
  UNPAID: { label: 'Reservation fee unpaid', color: 'text-yellow-500' },
  PAID: { label: 'Reservation fee paid', color: 'text-[#78ad44]' },
  FORFEITED: { label: 'Reservation fee forfeited', color: 'text-red-500' },
  REFUNDED: { label: 'Reservation fee refunded', color: 'text-gray-500' },
  NOT_REQUIRED: { label: 'Reservation fee not required', color: 'text-gray-500' },
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
    return `${getBookingTotalHours(booking)} hours`;
  }

  const { fullDays, remainingHours } = getRentalDurationParts(booking.startTime, booking.endTime);
  const parts = [];
  if (fullDays > 0) {
    parts.push(`${fullDays} days`);
  }
  if (remainingHours > 0) {
    parts.push(`${remainingHours} hours`);
  }
  return parts.join(' ');
}

export function getBookingVehicleFallback(booking: ApiBookingResponse) {
  return MOCK_VEHICLES.find((vehicle) => Number(vehicle.id) === booking.vehicleId) ?? null;
}

export function getBookingVehicleName(booking: ApiBookingResponse): string {
  return booking.vehicleName ?? getBookingVehicleFallback(booking)?.name ?? `Vehicle #${booking.vehicleId}`;
}

export function getBookingVehicleImage(booking: ApiBookingResponse): string | undefined {
  return booking.vehiclePrimaryImageUrl ?? getBookingVehicleFallback(booking)?.image;
}

export function getBookingBookedSubtotal(booking: ApiBookingResponse): number {
  return (booking.baseAmount ?? 0)
    + (booking.extraServicesAmount ?? 0)
    + (booking.deliveryFeeAmount ?? 0);
}

export function getBookingExtraServiceSummary(booking: ApiBookingResponse): string {
  const services = [];
  if (booking.insuranceSelected) {
    services.push('Insurance');
  }
  if ((booking.childSeatQuantity ?? 0) > 0) {
    services.push(`Child seat x ${booking.childSeatQuantity}`);
  }
  if (booking.gpsSelected) {
    services.push('GPS');
  }
  return services.length > 0 ? services.join(', ') : 'None';
}

export function getSecurityDepositPaymentLabel(
  gateway?: ApiBookingResponse['securityDepositGateway'],
): string {
  switch (gateway) {
    case 'PAYPAL':
      return 'Online payment - PayPal';
    case 'VNPAY':
      return 'Online payment - VNPay';
    case 'WALLET':
      return 'Refund balance';
    case 'CASH':
      return 'Cash';
    default:
      return 'Online payment';
  }
}

export function isBookingCancellable(booking: ApiBookingResponse): boolean {
  return booking.status === 'PENDING' || booking.status === 'CONFIRMED' || booking.status === 'PAID';
}
