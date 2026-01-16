import type { AxiosError, AxiosInstance } from 'axios';
import type {
  User,
  AiModel,
  Template,
  Generation,
  ApiResponse,
  AspectRatio,
  UserSettings,
  PaginatedResponse,
} from 'src/types';

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse<unknown>>) => {
        const message = error.response?.data?.error || error.message;
        console.error('API Error:', message);
        return Promise.reject(new Error(message));
      }
    );
  }

  setInitData(initData: string): void {
    this.client.defaults.headers.common['X-Telegram-Init-Data'] = initData;
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
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
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
}

export const apiService = new ApiService();
