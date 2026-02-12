export interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode: string;
  isAgeConfirmed: boolean;
  balance: number;
  createdAt: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  defaultModel: string;
  defaultAspectRatio: string;
  notificationsEnabled: boolean;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  previewImage?: string;
  promptTemplate: string;
}

export interface AiModel {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  costPerGeneration: number;
  maxWidth: number;
  maxHeight: number;
  supportedRatios: string[];
}

export interface Generation {
  id: string;
  model: string;
  prompt: string;
  aspectRatio: string;
  status: GenerationStatus;
  sourceImageUrl?: string;
  generatedImageUrl?: string;
  errorMessage?: string;
  cost: number;
  createdAt: string;
}

export type GenerationStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Payment types
export type PaymentStatus = 'CREATED' | 'PENDING' | 'SUCCEEDED' | 'CANCELLED' | 'REFUNDED';

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  confirmationUrl?: string;
  createdAt: string;
  completedAt?: string;
}

export interface PaymentAmounts {
  amounts: number[];
  currency: string;
  isConfigured: boolean;
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'REFUND' | 'BONUS';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: TransactionStatus;
  description?: string;
  createdAt: string;
  completedAt?: string;
}
