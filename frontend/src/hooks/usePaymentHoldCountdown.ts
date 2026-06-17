import { useEffect, useState } from 'react';

function calculateRemainingSeconds(expiresAt?: string) {
  if (!expiresAt) {
    return null;
  }

  return Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000),
  );
}

export function usePaymentHoldCountdown(expiresAt?: string, active = true) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(
    () => active ? calculateRemainingSeconds(expiresAt) : null,
  );

  useEffect(() => {
    if (!active || !expiresAt) {
      return;
    }

    const updateRemainingTime = () => {
      setRemainingSeconds(calculateRemainingSeconds(expiresAt));
    };

    updateRemainingTime();
    const timer = window.setInterval(updateRemainingTime, 1000);
    return () => window.clearInterval(timer);
  }, [active, expiresAt]);

  return {
    remainingSeconds,
    expired: remainingSeconds === 0 && Boolean(expiresAt),
  };
}
