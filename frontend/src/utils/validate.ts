import dayjs from 'dayjs';

/** Số điện thoại Việt Nam: 03x, 05x, 07x, 08x, 09x */
export function validatePhoneVN(phone: string): boolean {
  return /^(0[3-9][0-9]{8})$/.test(phone.trim());
}

/** Số CCCD 12 chữ số */
export function validateCCCD(cccd: string): boolean {
  return /^\d{12}$/.test(cccd.trim());
}

/** Email hợp lệ */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Mật khẩu tối thiểu 8 ký tự, có chữ hoa và số */
export function validatePassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 8) return { valid: false, message: 'Tối thiểu 8 ký tự' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Cần ít nhất 1 chữ hoa' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Cần ít nhất 1 chữ số' };
  return { valid: true };
}

/** Kiểm tra đủ 18 tuổi */
export function validateAge(dateOfBirth: string): boolean {
  const today = dayjs();
  const dob = dayjs(dateOfBirth);
  return today.diff(dob, 'year') >= 18;
}
