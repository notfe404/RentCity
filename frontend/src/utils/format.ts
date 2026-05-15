import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';

dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.locale('vi');

/** Format VND: 1500000 → "1.500.000 ₫" */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

/** Format VND compact cho card/badge: 1500000 → "1,5M ₫" */
export function formatVNDCompact(amount: number): string {
  if (amount >= 1_000_000) {
    const val = (amount / 1_000_000).toFixed(1).replace('.0', '');
    return `${val}M ₫`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}K ₫`;
  }
  return `${amount} ₫`;
}

/** Format ngày + giờ: "10:00, 15/03/2024" */
export function formatDateTime(dateStr: string): string {
  return dayjs(dateStr).format('HH:mm, DD/MM/YYYY');
}

/** Format chỉ ngày: "15/03/2024" */
export function formatDate(dateStr: string): string {
  return dayjs(dateStr).format('DD/MM/YYYY');
}

/** Thời gian tương đối: "2 giờ trước" */
export function formatRelative(dateStr: string): string {
  return dayjs(dateStr).fromNow();
}

/** Tính số ngày giữa 2 mốc */
export function calcDays(startDate: string, endDate: string): number {
  return Math.max(1, dayjs(endDate).diff(dayjs(startDate), 'day'));
}

/** Format điểm loyalty: 15000 → "15.000 pts" */
export function formatPoints(points: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(points)} pts`;
}
