import { useMemo } from 'react';

export const useRentalDuration = (startTime: string | null, endTime: string | null) => {
  return useMemo(() => {
    if (!startTime || !endTime) return 0;

    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    if (end <= start) return 0;

    // Calculate milliseconds and convert to hours
    const diffInMs = end - start;
    const diffInHours = diffInMs / (1000 * 60 * 60);

    // Round up to one hour according to design rules (1 hour 5 minutes -> 2 hours)
    return Math.ceil(diffInHours);
  }, [startTime, endTime]);
};
