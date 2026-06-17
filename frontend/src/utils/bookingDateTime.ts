import type { ApiPricingMode } from '@/types';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export interface RentalDurationParts {
  totalHours: number;
  fullDays: number;
  remainingHours: number;
  roundedDays: number;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export const TIME_OPTIONS_24H = Array.from({ length: 24 }, (_, hour) => `${pad(hour)}:00`);

export function formatDateTimeLocalValue(date: Date): string {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parseDateTimeLocalValue(value: string): Date {
  return new Date(value);
}

export function splitDateTimeLocalValue(value: string): { datePart: string; timePart: string } {
  const date = parseDateTimeLocalValue(value);
  return {
    datePart: [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
    ].join('-'),
    timePart: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

export function combineDateAndTimeParts(datePart: string, timePart: string): string {
  return `${datePart}T${timePart}`;
}

export function clampDateTimeLocalValue(value: string, minValue?: string): string {
  if (!minValue) {
    return value;
  }

  if (parseDateTimeLocalValue(value).getTime() < parseDateTimeLocalValue(minValue).getTime()) {
    return minValue;
  }

  return value;
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + (hours * HOUR_MS));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + (days * DAY_MS));
}

export function getNextRentableDateTime(now: Date = new Date()): Date {
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setMinutes(0);
  next.setHours(next.getHours() + 1);
  return next;
}

export function getDefaultBookingRange() {
  const start = getNextRentableDateTime();
  const end = addHours(start, 4);
  return {
    startDate: formatDateTimeLocalValue(start),
    endDate: formatDateTimeLocalValue(end),
  };
}

export function getMinimumEndDateTime(startValue: string): string {
  return formatDateTimeLocalValue(addHours(parseDateTimeLocalValue(startValue), 1));
}

export function ensureFutureEndDateTime(startValue: string, endValue: string): string {
  if (parseDateTimeLocalValue(endValue).getTime() > parseDateTimeLocalValue(startValue).getTime()) {
    return endValue;
  }
  return getMinimumEndDateTime(startValue);
}

export function getDurationHours(startValue: string, endValue: string): number {
  const diffMs = parseDateTimeLocalValue(endValue).getTime() - parseDateTimeLocalValue(startValue).getTime();
  return Math.max(1, Math.ceil(diffMs / HOUR_MS));
}

export function getRentalDurationParts(startValue: string, endValue: string): RentalDurationParts {
  const totalHours = getDurationHours(startValue, endValue);
  return {
    totalHours,
    fullDays: Math.floor(totalHours / 24),
    remainingHours: totalHours % 24,
    roundedDays: Math.max(1, Math.ceil(totalHours / 24)),
  };
}

export function getDurationDays(startValue: string, endValue: string): number {
  return getRentalDurationParts(startValue, endValue).roundedDays;
}

export function inferPricingMode(startValue: string, endValue: string): ApiPricingMode {
  return getDurationHours(startValue, endValue) < 24 ? 'HOURLY' : 'DAILY';
}

export function getDurationLabel(startValue: string, endValue: string, pricingMode?: ApiPricingMode): string {
  const mode = pricingMode ?? inferPricingMode(startValue, endValue);
  if (mode === 'HOURLY') {
    return `${getDurationHours(startValue, endValue)} giờ`;
  }

  const { fullDays, remainingHours } = getRentalDurationParts(startValue, endValue);
  const parts = [];
  if (fullDays > 0) {
    parts.push(`${fullDays} ngày`);
  }
  if (remainingHours > 0) {
    parts.push(`${remainingHours} giờ`);
  }
  return parts.join(' ');
}

export function getDailyRentalAmount(startValue: string, endValue: string, pricePerDay: number): number {
  const { fullDays, remainingHours } = getRentalDurationParts(startValue, endValue);
  const hourlyRate = Math.round(pricePerDay / 24);
  return fullDays * pricePerDay + remainingHours * hourlyRate;
}

export function toBackendDateTime(value: string): string {
  return value.length === 16 ? `${value}:00` : value;
}
