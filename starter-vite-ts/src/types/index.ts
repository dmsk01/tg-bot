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
