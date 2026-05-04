import type { MockVehicle } from './mockVehicles';
import { MOCK_VEHICLES } from './mockVehicles';

// ============================================================
// Mock Bookings — Đơn đặt xe tiếng Việt
// ============================================================

export type MockBookingStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

export interface MockBooking {
  id: string;
  bookingCode: string;
  vehicleId: string;
  vehicle: MockVehicle;
  pickupLocationId: string;
  pickupLocationName: string;
  returnLocationId: string;
  returnLocationName: string;
  startDate: string;          // ISO
  endDate: string;
  totalDays: number;
  baseAmount: number;
  extrasAmount: number;
  discountAmount: number;
  totalAmount: number;
  depositAmount: number;
  status: MockBookingStatus;
  paymentStatus: 'paid' | 'pending' | 'refunded';
  extras: string[];
  customerNote: string;
  createdAt: string;
}

const v = (id: string) => MOCK_VEHICLES.find(v => v.id === id)!;

export const MOCK_BOOKINGS: MockBooking[] = [
  {
    id: 'bk-01',
    bookingCode: 'RC-20260427-A1B2',
    vehicleId: '1',
    vehicle: v('1'),
    pickupLocationId: 'loc-02',
    pickupLocationName: 'CN Hoàn Kiếm',
    returnLocationId: 'loc-02',
    returnLocationName: 'CN Hoàn Kiếm',
    startDate: '2026-04-28T10:00:00',
    endDate: '2026-05-01T10:00:00',
    totalDays: 3,
    baseAmount: 2100000,
    extrasAmount: 600000,
    discountAmount: 0,
    totalAmount: 2700000,
    depositAmount: 810000,
    status: 'upcoming',
    paymentStatus: 'paid',
    extras: ['Bảo hiểm toàn diện'],
    customerNote: '',
    createdAt: '2026-04-25T14:30:00',
  },
  {
    id: 'bk-02',
    bookingCode: 'RC-20260420-C3D4',
    vehicleId: '3',
    vehicle: v('3'),
    pickupLocationId: 'loc-01',
    pickupLocationName: 'CN Nội Bài',
    returnLocationId: 'loc-03',
    returnLocationName: 'CN Cầu Giấy',
    startDate: '2026-04-20T08:00:00',
    endDate: '2026-04-23T08:00:00',
    totalDays: 3,
    baseAmount: 3300000,
    extrasAmount: 600000,
    discountAmount: 330000,
    totalAmount: 3570000,
    depositAmount: 1071000,
    status: 'completed',
    paymentStatus: 'paid',
    extras: ['Bảo hiểm toàn diện'],
    customerNote: 'Nhận xe tại sảnh đến nội địa',
    createdAt: '2026-04-18T09:00:00',
  },
  {
    id: 'bk-03',
    bookingCode: 'RC-20260410-E5F6',
    vehicleId: '5',
    vehicle: v('5'),
    pickupLocationId: 'loc-02',
    pickupLocationName: 'CN Hoàn Kiếm',
    returnLocationId: 'loc-02',
    returnLocationName: 'CN Hoàn Kiếm',
    startDate: '2026-04-10T09:00:00',
    endDate: '2026-04-12T09:00:00',
    totalDays: 2,
    baseAmount: 3000000,
    extrasAmount: 400000,
    discountAmount: 0,
    totalAmount: 3400000,
    depositAmount: 1020000,
    status: 'completed',
    paymentStatus: 'paid',
    extras: ['Bảo hiểm toàn diện'],
    customerNote: '',
    createdAt: '2026-04-08T11:00:00',
  },
  {
    id: 'bk-04',
    bookingCode: 'RC-20260405-G7H8',
    vehicleId: '9',
    vehicle: v('9'),
    pickupLocationId: 'loc-02',
    pickupLocationName: 'CN Hoàn Kiếm',
    returnLocationId: 'loc-04',
    returnLocationName: 'CN Long Biên',
    startDate: '2026-04-05T10:00:00',
    endDate: '2026-04-06T10:00:00',
    totalDays: 1,
    baseAmount: 2000000,
    extrasAmount: 0,
    discountAmount: 0,
    totalAmount: 2000000,
    depositAmount: 600000,
    status: 'cancelled',
    paymentStatus: 'refunded',
    extras: [],
    customerNote: 'Hủy do thay đổi lịch trình',
    createdAt: '2026-04-03T16:00:00',
  },
  {
    id: 'bk-05',
    bookingCode: 'RC-20260501-J9K0',
    vehicleId: '7',
    vehicle: v('7'),
    pickupLocationId: 'loc-04',
    pickupLocationName: 'CN Long Biên',
    returnLocationId: 'loc-04',
    returnLocationName: 'CN Long Biên',
    startDate: '2026-05-01T07:00:00',
    endDate: '2026-05-04T17:00:00',
    totalDays: 4,
    baseAmount: 5200000,
    extrasAmount: 1000000,
    discountAmount: 520000,
    totalAmount: 5680000,
    depositAmount: 1704000,
    status: 'upcoming',
    paymentStatus: 'paid',
    extras: ['Bảo hiểm toàn diện', 'GPS'],
    customerNote: 'Đi Sapa, cần xe gầm cao',
    createdAt: '2026-04-26T08:00:00',
  },
];

export const BOOKING_STATUS_LABEL: Record<MockBookingStatus, { label: string; color: string; bg: string }> = {
  upcoming:  { label: 'Sắp tới',    color: 'text-[#78ad44]', bg: 'bg-[#78ad44]' },
  active:    { label: 'Đang thuê',  color: 'text-blue-600',  bg: 'bg-blue-600' },
  completed: { label: 'Hoàn thành', color: 'text-gray-500',  bg: 'bg-gray-700' },
  cancelled: { label: 'Đã hủy',    color: 'text-red-500',   bg: 'bg-red-500' },
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  paid: 'Đã thanh toán',
  pending: 'Chờ thanh toán',
  refunded: 'Đã hoàn tiền',
};
