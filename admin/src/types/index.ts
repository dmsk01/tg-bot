export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'SUPPORT';

export interface AdminUser {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode: string;
  balance: number;
  isBlocked: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PromocodeType = 'FIXED_AMOUNT' | 'PERCENTAGE' | 'BONUS_CREDITS';

export interface Promocode {
  id: string;
  code: string;
  type: PromocodeType;
  value: number;
  maxUsages?: number;
  maxUsagesPerUser: number;
  minBalance?: number;
  startsAt?: string;
  expiresAt?: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    usages: number;
  };
  createdBy?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface PromocodeUsage {
  id: string;
  promocodeId: string;
  userId: string;
  appliedValue: number;
  usedAt: string;
  user?: {
    id: string;
    telegramId: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
