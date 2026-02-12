import type { AxiosError, AxiosInstance } from 'axios';
import type {
  User,
  AiModel,
  Payment,
  Template,
  Generation,
  ApiResponse,
  AspectRatio,
  Transaction,
  UserSettings,
  PaymentAmounts,
  PaginatedResponse,
} from 'src/types';

import axios from 'axios';

import { logger } from 'src/utils/logger';

import { CONFIG } from 'src/global-config';

const API_URL = CONFIG.serverUrl;

// Remove trailing slash and /api suffix if present to avoid duplication
function getBaseUrl(url: string): string {
  const baseUrl = url.replace(/\/+$/, ''); // Remove trailing slashes
  if (baseUrl.endsWith('/api')) {
    return baseUrl; // Already has /api
  }
  return `${baseUrl}/api`;
}

class ApiService {
  private client: AxiosInstance;

  private initData: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: getBaseUrl(API_URL),
      timeout: 30000,
    });

    // Add initData header to every request
    this.client.interceptors.request.use((config) => {
      // DEBUG: Log request info
      console.log('[API] Request:', config.method?.toUpperCase(), config.url);
      console.log('[API] initData set:', !!this.initData);

      if (this.initData) {
        config.headers['X-Telegram-Init-Data'] = this.initData;
        console.log('[API] Header added, length:', this.initData.length);
      } else {
        console.warn('[API] WARNING: No initData available!');
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse<unknown>>) => {
        const message = error.response?.data?.error || error.message;
        console.error('[API] Error:', message, error.response?.status);
        return Promise.reject(new Error(message));
      }
    );
  }

  setInitData(initData: string): void {
    console.log('[API] setInitData called, length:', initData?.length);
    this.initData = initData;
  }

  // DEBUG: Get debug info for troubleshooting
  getDebugInfo(): string {
    return JSON.stringify({
      hasInitData: !!this.initData,
      initDataLength: this.initData?.length || 0,
      baseURL: this.client.defaults.baseURL,
    }, null, 2);
  }

  // User endpoints
  async getMe(): Promise<User> {
    const response = await this.client.get<ApiResponse<User>>('/user/me');
    return response.data.data!;
  }

  async getBalance(): Promise<number> {
    const response = await this.client.get<ApiResponse<{ balance: number }>>('/user/balance');
    return response.data.data!.balance;
  }

  async getSettings(): Promise<UserSettings> {
    const response = await this.client.get<ApiResponse<UserSettings>>('/user/settings');
    return response.data.data!;
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const response = await this.client.patch<ApiResponse<UserSettings>>('/user/settings', settings);
    return response.data.data!;
  }

  async updateLanguage(languageCode: string): Promise<void> {
    await this.client.patch('/user/language', { languageCode });
  }

  async confirmAge(): Promise<void> {
    await this.client.post('/user/age-confirm');
  }

  // Templates endpoints
  async getTemplates(category?: string): Promise<Template[]> {
    const params = category ? { category } : {};
    const response = await this.client.get<ApiResponse<Template[]>>('/templates', { params });
    return response.data.data!;
  }

  async getTemplateCategories(): Promise<string[]> {
    const response = await this.client.get<ApiResponse<string[]>>('/templates/categories');
    return response.data.data!;
  }

  // Models endpoints
  async getModels(): Promise<AiModel[]> {
    const response = await this.client.get<ApiResponse<AiModel[]>>('/models');
    return response.data.data!;
  }

  // Generation endpoints
  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await this.client.post<ApiResponse<{ url: string }>>(
      '/generation/upload',
      formData
    );
    return response.data.data!;
  }

  async createGeneration(params: {
    model: string;
    prompt: string;
    negativePrompt?: string;
    templateId?: string;
    aspectRatio: AspectRatio;
    sourceImageUrl?: string;
  }): Promise<{ id: string; status: string; cost: number }> {
    const response = await this.client.post<
      ApiResponse<{ id: string; status: string; cost: number }>
    >('/generation/create', params);
    return response.data.data!;
  }

  async getGenerationStatus(id: string): Promise<Generation> {
    const response = await this.client.get<ApiResponse<Generation>>(`/generation/${id}`);
    return response.data.data!;
  }

  async getGenerationHistory(page = 1, limit = 10): Promise<PaginatedResponse<Generation>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<Generation>>>(
      '/generation/history',
      { params: { page, limit } }
    );
    return response.data.data!;
  }

  async deleteGeneration(id: string): Promise<void> {
    await this.client.delete(`/generation/${id}`);
  }

  // Payment endpoints
  async getPaymentAmounts(): Promise<PaymentAmounts> {
    const response = await this.client.get<ApiResponse<PaymentAmounts>>('/payments/amounts');
    return response.data.data!;
  }

  async createPayment(amount: number): Promise<Payment> {
    const idempotencyKey = crypto.randomUUID();
    const response = await this.client.post<
      ApiResponse<{ paymentId: string; confirmationUrl: string; status: string }>
    >('/payments/create', { amount, idempotencyKey });

    const data = response.data.data!;
    return {
      id: data.paymentId,
      amount,
      currency: 'RUB',
      status: data.status as Payment['status'],
      confirmationUrl: data.confirmationUrl,
      createdAt: new Date().toISOString(),
    };
  }

  async getPaymentStatus(paymentId: string): Promise<Payment> {
    const response = await this.client.get<ApiResponse<Payment>>(`/payments/${paymentId}`);
    return response.data.data!;
  }

  // Transaction endpoints
  async getTransactions(
    page = 1,
    limit = 20,
    type?: string
  ): Promise<{ transactions: Transaction[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const params: Record<string, string | number> = { page, limit };
    if (type) params.type = type;

    const response = await this.client.get<
      ApiResponse<{ transactions: Transaction[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>
    >('/transactions', { params });

    return response.data.data!;
  }
}

export const apiService = new ApiService();
