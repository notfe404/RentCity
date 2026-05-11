import { useMemo } from 'react';

export const useRentalDuration = (startTime: string | null, endTime: string | null) => {
  return useMemo(() => {
    if (!startTime || !endTime) return 0;

    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    if (end <= start) return 0;

    // Tính toán số mili-giây, chuyển sang giờ
    const diffInMs = end - start;
    const diffInHours = diffInMs / (1000 * 60 * 60);

    // Làm tròn lên 1 giờ theo rules thiết kế (1 giờ 5 phút -> 2 giờ)
    return Math.ceil(diffInHours);
  }, [startTime, endTime]);
};
