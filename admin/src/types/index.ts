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

// User Detail Types
export interface UserDetail extends User {
  lastActiveAt?: string;
  referralCode?: string;
  _count?: {
    generations: number;
    transactions: number;
    promocodeUsages?: number;
  };
}

// Generation Types
export type GenerationType = 'TEXT_TO_IMAGE' | 'IMAGE_TO_IMAGE' | 'INPAINTING';
export type GenerationStatus = 'PENDING' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'MODERATED';

export interface Generation {
  id: string;
  userId: string;
  generationType: GenerationType;
  model: string;
  prompt: string;
  negativePrompt?: string;
  status: GenerationStatus;
  cost: number;
  resultUrl?: string;
  resultTelegramFileId?: string;
  errorMessage?: string;
  moderationReason?: string;
  createdAt: string;
  completedAt?: string;
}

// Transaction Types
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'REFUND' | 'BONUS';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: TransactionStatus;
  description?: string;
  createdAt: string;
  completedAt?: string;
}

// Admin Log Types
export interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
  admin?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    role?: AdminRole;
  };
}

// Export Types
export type ExportFormat = 'csv' | 'xlsx';
