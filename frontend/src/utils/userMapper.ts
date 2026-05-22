import type { ApiUser, User } from '@/types';

export function mapApiUserToUser(apiUser: ApiUser): User {
  const encodedName = encodeURIComponent(apiUser.fullName || apiUser.email);

  return {
    id: String(apiUser.id),
    email: apiUser.email,
    fullName: apiUser.fullName,
    phone: apiUser.phone,
    idCardUrl: apiUser.idCardUrl,
    role: apiUser.role,
    kycStatus: apiUser.kycStatus,
    status: apiUser.kycStatus === 'PENDING' ? 'PENDING_VERIFY' : 'ACTIVE',
    loyaltyPoints: 0,
    tier: 'STANDARD',
    avatarUrl: `https://ui-avatars.com/api/?name=${encodedName}&background=78ad44&color=fff`,
    createdAt: '',
    updatedAt: '',
  };
}

