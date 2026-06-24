// ============================================================
// Formatters - VND money and dates
// ============================================================

const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'decimal',
  maximumFractionDigits: 0,
});

/**
 * Format number to VND string: 800000 → "800.000₫"
 */
export function formatVND(amount: number): string {
  return vndFormatter.format(amount) + '₫';
}

/**
 * Format number to short VND: 800000 → "800K"
 */
export function formatVNDShort(amount: number): string {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return (Number.isInteger(m) ? m : m.toFixed(1)) + 'M';
  }
  if (amount >= 1_000) {
    const k = amount / 1_000;
    return (Number.isInteger(k) ? k : k.toFixed(0)) + 'K';
  }
  return String(amount);
}

/**
 * Format ISO date → "26/04/2026"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format ISO date → "26/04/2026, 14:00"
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format ISO date → "Saturday, April 26, 2026"
 */
export function formatDateLong(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
