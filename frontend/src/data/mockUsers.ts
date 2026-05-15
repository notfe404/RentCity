// Mock users for local development — DO NOT use in production
import type { User } from '@/types';

interface MockUser extends User {
  password: string;
}

export const MOCK_USERS: Record<string, MockUser> = {
  'customer@demo.com': {
    id: 'u-001',
    email: 'customer@demo.com',
    password: '123456',
    fullName: 'John Doe (Customer)',
    phone: '+1 234 567 890',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    loyaltyPoints: 1200,
    tier: 'SILVER',
    avatarUrl: 'https://ui-avatars.com/api/?name=John+Doe&background=78ad44&color=fff',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  'staff@demo.com': {
    id: 'u-002',
    email: 'staff@demo.com',
    password: '123456',
    fullName: 'Sarah Manager (Staff)',
    phone: '+1 987 654 321',
    role: 'STAFF',
    status: 'ACTIVE',
    loyaltyPoints: 0,
    tier: 'STANDARD',
    avatarUrl: 'https://ui-avatars.com/api/?name=Sarah+Manager&background=4299e1&color=fff',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  'admin@demo.com': {
    id: 'u-003',
    email: 'admin@demo.com',
    password: '123456',
    fullName: 'Admin User',
    phone: '+1 111 222 333',
    role: 'ADMIN',
    status: 'ACTIVE',
    loyaltyPoints: 0,
    tier: 'STANDARD',
    avatarUrl: 'https://ui-avatars.com/api/?name=Admin+User&background=212529&color=fff',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
};
