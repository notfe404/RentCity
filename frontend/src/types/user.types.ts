// ============================================================
// User Types — B2C Model
// ============================================================

export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFY';
export type CustomerTier = 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  loyaltyPoints: number;    // điểm tích lũy
  tier: CustomerTier;       // hạng thành viên
  createdAt: string;
  updatedAt: string;
}

export type DocType = 'CCCD' | 'DRIVING_LICENSE';

export interface UserDocument {
  id: string;
  userId: string;
  docType: DocType;
  docNumber?: string;       // masked để bảo mật
  frontUrl?: string;        // S3 URL
  backUrl?: string;
  expiresAt?: string;
  verified: boolean;
  verifiedBy?: string;      // staff id
  verifiedAt?: string;
}

// Tier label & màu badge
export const TIER_CONFIG: Record<CustomerTier, { label: string; color: string }> = {
  STANDARD: { label: 'Standard', color: 'gray' },
  SILVER:   { label: 'Silver',   color: 'slate' },
  GOLD:     { label: 'Gold',     color: 'yellow' },
  PLATINUM: { label: 'Platinum', color: 'cyan' },
};

// ---- Auth request/response ----
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
