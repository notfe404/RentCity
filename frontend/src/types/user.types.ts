export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFY';
export type CustomerTier = 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM';
export type KycStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl?: string;
  idCardUrl?: string;
  role: UserRole;
  kycStatus?: KycStatus;
  status: UserStatus;
  loyaltyPoints: number;
  tier: CustomerTier;
  createdAt: string;
  updatedAt: string;
}

export interface ApiUser {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  idCardUrl?: string;
  role: UserRole;
  kycStatus: KycStatus;
}

export type DocType = 'CCCD' | 'DRIVING_LICENSE';

export interface UserDocument {
  id: number;
  userId: number;
  docType: DocType;
  docNumber?: string;
  frontUrl?: string;
  backUrl?: string;
  expiresAt?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt?: string;
}

export const TIER_CONFIG: Record<CustomerTier, { label: string; color: string }> = {
  STANDARD: { label: 'Standard', color: 'gray' },
  SILVER: { label: 'Silver', color: 'slate' },
  GOLD: { label: 'Gold', color: 'yellow' },
  PLATINUM: { label: 'Platinum', color: 'cyan' },
};

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
  user: ApiUser;
}
