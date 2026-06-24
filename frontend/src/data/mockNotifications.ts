import type { Notification, NotificationType } from '@/types';

// ============================================================
// Mock Notifications - English notification data
// ============================================================

export interface MockNotification extends Notification {
  icon?: string;   // emoji for display
}

const NOTIF_ICON: Partial<Record<NotificationType, string>> = {
  BOOKING_CONFIRMED: '✅',
  CHECKIN_REMINDER: '🔑',
  CHECKOUT_REMINDER: '🏁',
  PAYMENT_SUCCESS: '💳',
  PAYMENT_FAILED: '❌',
  BOOKING_CANCELLED: '🚫',
  PROMOTION_NEW: '🎁',
  REVIEW_REQUEST: '⭐',
};

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: 'n-01', userId: 'u-01', type: 'BOOKING_CONFIRMED',
    title: 'Booking successful',
    body: 'Toyota Vios 2024 booking (#RC-20260427-A1B2) has been confirmed. Pick-up date: 28/04/2026.',
    data: { booking_id: 'bk-01' },
    isRead: false, createdAt: '2026-04-25T14:30:00Z',
    icon: NOTIF_ICON.BOOKING_CONFIRMED,
  },
  {
    id: 'n-02', userId: 'u-01', type: 'PAYMENT_SUCCESS',
    title: 'Payment successful',
    body: 'You paid 2,700,000 VND for booking #RC-20260427-A1B2 via VNPay.',
    data: { booking_id: 'bk-01' },
    isRead: false, createdAt: '2026-04-25T14:31:00Z',
    icon: NOTIF_ICON.PAYMENT_SUCCESS,
  },
  {
    id: 'n-03', userId: 'u-01', type: 'CHECKIN_REMINDER',
    title: 'Pick-up Reminder',
    body: 'You have a Toyota Vios pick-up tomorrow (28/04) at 10:00 at the Cau Giay branch.',
    data: { booking_id: 'bk-01' },
    isRead: true, createdAt: '2026-04-27T08:00:00Z',
    icon: NOTIF_ICON.CHECKIN_REMINDER,
  },
  {
    id: 'n-04', userId: 'u-01', type: 'REVIEW_REQUEST',
    title: 'Trip Review',
    body: 'Your Hyundai Tucson 2024 trip is complete. Share your experience!',
    data: { booking_id: 'bk-02', vehicle_id: '3' },
    isRead: true, createdAt: '2026-04-23T09:00:00Z',
    icon: NOTIF_ICON.REVIEW_REQUEST,
  },
  {
    id: 'n-05', userId: 'u-01', type: 'PROMOTION_NEW',
    title: 'New Promotion!',
    body: 'Get 10% off your next booking with code RENTCITY10. Valid until 30/05/2026.',
    isRead: true, createdAt: '2026-04-20T10:00:00Z',
    icon: NOTIF_ICON.PROMOTION_NEW,
  },
  {
    id: 'n-06', userId: 'u-01', type: 'BOOKING_CANCELLED',
    title: 'Booking Cancelled',
    body: 'Booking #RC-20260405-G7H8 (Mercedes-Benz C200) was cancelled. The deposit will be refunded in 3-5 days.',
    data: { booking_id: 'bk-04' },
    isRead: true, createdAt: '2026-04-05T11:00:00Z',
    icon: NOTIF_ICON.BOOKING_CANCELLED,
  },
  {
    id: 'n-07', userId: 'u-01', type: 'BOOKING_CONFIRMED',
    title: 'Booking successful',
    body: 'Toyota Fortuner 2024 booking (#RC-20260501-J9K0) has been confirmed. Get ready for Sapa!',
    data: { booking_id: 'bk-05' },
    isRead: false, createdAt: '2026-04-26T08:00:00Z',
    icon: NOTIF_ICON.BOOKING_CONFIRMED,
  },
];
