import type { Notification, NotificationType } from '@/types';

// ============================================================
// Mock Notifications — Thông báo tiếng Việt
// ============================================================

export interface MockNotification extends Notification {
  icon: string;   // emoji for display
}

const NOTIF_ICON: Record<NotificationType, string> = {
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
    title: 'Đặt xe thành công',
    body: 'Đơn đặt xe Toyota Vios 2024 (#RC-20260427-A1B2) đã được xác nhận. Ngày nhận: 28/04/2026.',
    data: { booking_id: 'bk-01' },
    isRead: false, createdAt: '2026-04-25T14:30:00Z',
    icon: NOTIF_ICON.BOOKING_CONFIRMED,
  },
  {
    id: 'n-02', userId: 'u-01', type: 'PAYMENT_SUCCESS',
    title: 'Thanh toán thành công',
    body: 'Bạn đã thanh toán 2.700.000₫ cho đơn #RC-20260427-A1B2 qua VNPay.',
    data: { booking_id: 'bk-01' },
    isRead: false, createdAt: '2026-04-25T14:31:00Z',
    icon: NOTIF_ICON.PAYMENT_SUCCESS,
  },
  {
    id: 'n-03', userId: 'u-01', type: 'CHECKIN_REMINDER',
    title: 'Nhắc nhận xe',
    body: 'Bạn có lịch nhận xe Toyota Vios vào ngày mai (28/04) lúc 10:00 tại CN Cầu Giấy.',
    data: { booking_id: 'bk-01' },
    isRead: true, createdAt: '2026-04-27T08:00:00Z',
    icon: NOTIF_ICON.CHECKIN_REMINDER,
  },
  {
    id: 'n-04', userId: 'u-01', type: 'REVIEW_REQUEST',
    title: 'Đánh giá chuyến đi',
    body: 'Chuyến đi Hyundai Tucson 2024 đã hoàn thành. Hãy chia sẻ trải nghiệm của bạn!',
    data: { booking_id: 'bk-02', vehicle_id: '3' },
    isRead: true, createdAt: '2026-04-23T09:00:00Z',
    icon: NOTIF_ICON.REVIEW_REQUEST,
  },
  {
    id: 'n-05', userId: 'u-01', type: 'PROMOTION_NEW',
    title: 'Khuyến mãi mới!',
    body: 'Giảm 10% cho đơn hàng tiếp theo với mã RENTCITY10. Áp dụng đến 30/05/2026.',
    isRead: true, createdAt: '2026-04-20T10:00:00Z',
    icon: NOTIF_ICON.PROMOTION_NEW,
  },
  {
    id: 'n-06', userId: 'u-01', type: 'BOOKING_CANCELLED',
    title: 'Đơn đã hủy',
    body: 'Đơn #RC-20260405-G7H8 (Mercedes-Benz C200) đã được hủy. Tiền cọc sẽ hoàn trong 3-5 ngày.',
    data: { booking_id: 'bk-04' },
    isRead: true, createdAt: '2026-04-05T11:00:00Z',
    icon: NOTIF_ICON.BOOKING_CANCELLED,
  },
  {
    id: 'n-07', userId: 'u-01', type: 'BOOKING_CONFIRMED',
    title: 'Đặt xe thành công',
    body: 'Đơn đặt xe Toyota Fortuner 2024 (#RC-20260501-J9K0) đã được xác nhận. Chuẩn bị hành trang đi Sapa nào!',
    data: { booking_id: 'bk-05' },
    isRead: false, createdAt: '2026-04-26T08:00:00Z',
    icon: NOTIF_ICON.BOOKING_CONFIRMED,
  },
];
