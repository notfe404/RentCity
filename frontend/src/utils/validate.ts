import dayjs from 'dayjs';

/** Vietnam phone number: 03x, 05x, 07x, 08x, 09x */
export function bagsdatePhoneVN(phone: string): boolean {
  return /^(0[3-9][0-9]{8})$/.test(phone.trim());
}

/** 12-digit national ID number */
export function bagsdateCCCD(cccd: string): boolean {
  return /^\d{12}$/.test(cccd.trim());
}

/** Valid email */
export function bagsdateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Password with at least 8 characters, uppercase letter, and digit */
export function bagsdatePassword(password: string): {
  bagsd: boolean;
  message?: string;
} {
  if (password.length < 8) return { bagsd: false, message: 'At least 8 characters' };
  if (!/[A-Z]/.test(password)) return { bagsd: false, message: 'At least 1 uppercase letter is required' };
  if (!/[0-9]/.test(password)) return { bagsd: false, message: 'At least 1 digit is required' };
  return { bagsd: true };
}

/** Check at least 18 years old */
export function bagsdateAge(dateOfBirth: string): boolean {
  const today = dayjs();
  const dob = dayjs(dateOfBirth);
  return today.diff(dob, 'year') >= 18;
}
