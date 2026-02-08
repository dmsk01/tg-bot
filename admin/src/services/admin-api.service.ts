import axiosInstance from '../lib/axios';
import type {
  AdminUser,
  User,
  Promocode,
  PromocodeUsage,
  ApiResponse,
  PaginatedResponse,
  PromocodeType,
} from '../types';

class AdminApiService {
  // Auth - tokens are now stored in httpOnly cookies by the server
  async login(username: string, password: string): Promise<{ admin: AdminUser }> {
    const response = await axiosInstance.post<ApiResponse<{ admin: AdminUser }>>(
      '/admin/auth/login',
      { username, password }
    );

    if (response.data.success && response.data.data) {
      return { admin: response.data.data.admin };
    }

    throw new Error(response.data.error || 'Login failed');
  }

  async logout(): Promise<void> {
    await axiosInstance.post('/admin/auth/logout');
  }

  async refresh(): Promise<void> {
    // Refresh token is sent automatically via httpOnly cookie
    const response = await axiosInstance.post<ApiResponse<void>>('/admin/auth/refresh');

    if (!response.data.success) {
      throw new Error('Token refresh failed');
    }
  }

  async getMe(): Promise<AdminUser> {
    const response = await axiosInstance.get<ApiResponse<AdminUser>>('/admin/auth/me');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to get admin info');
  }

  // Users
  async getUsers(
    page = 1,
    limit = 20,
    search?: string
  ): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.set('search', search);

    const response = await axiosInstance.get<ApiResponse<PaginatedResponse<User>>>(
      `/admin/users?${params}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to get users');
  }

  async getUser(id: string): Promise<User> {
    const response = await axiosInstance.get<ApiResponse<User>>(`/admin/users/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to get user');
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await axiosInstance.patch<ApiResponse<User>>(`/admin/users/${id}`, data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update user');
  }

  async updateUserBalance(id: string, amount: number, reason: string): Promise<User> {
    const response = await axiosInstance.post<ApiResponse<User>>(
      `/admin/users/${id}/balance`,
      { amount, reason }
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update balance');
  }

  // Promocodes
  async getPromocodes(
    page = 1,
    limit = 20,
    filters?: {
      search?: string;
      type?: PromocodeType;
      isActive?: boolean;
    }
  ): Promise<PaginatedResponse<Promocode>> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (filters?.search) params.set('search', filters.search);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive));

    const response = await axiosInstance.get<ApiResponse<{ promocodes: Promocode[]; pagination: PaginatedResponse<Promocode>['pagination'] }>>(
      `/admin/promocodes?${params}`
    );

    if (response.data.success && response.data.data) {
      return {
        items: response.data.data.promocodes,
        pagination: response.data.data.pagination,
      };
    }
    throw new Error(response.data.error || 'Failed to get promocodes');
  }

  async getPromocode(id: string): Promise<Promocode> {
    const response = await axiosInstance.get<ApiResponse<Promocode>>(`/admin/promocodes/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to get promocode');
  }

  async createPromocode(data: {
    code?: string;
    type: PromocodeType;
    value: number;
    maxUsages?: number;
    maxUsagesPerUser?: number;
    minBalance?: number;
    startsAt?: string;
    expiresAt?: string;
    description?: string;
  }): Promise<Promocode> {
    const response = await axiosInstance.post<ApiResponse<Promocode>>('/admin/promocodes', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create promocode');
  }

  async updatePromocode(id: string, data: Partial<{
    type: PromocodeType;
    value: number;
    maxUsages: number | null;
    maxUsagesPerUser: number;
    minBalance: number | null;
    startsAt: string | null;
    expiresAt: string | null;
    description: string | null;
  }>): Promise<Promocode> {
    const response = await axiosInstance.patch<ApiResponse<Promocode>>(`/admin/promocodes/${id}`, data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update promocode');
  }

  async deletePromocode(id: string): Promise<void> {
    const response = await axiosInstance.delete<ApiResponse<void>>(`/admin/promocodes/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete promocode');
    }
  }

  async revokePromocode(id: string): Promise<Promocode> {
    const response = await axiosInstance.post<ApiResponse<Promocode>>(`/admin/promocodes/${id}/revoke`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to revoke promocode');
  }

  async generatePromocodes(data: {
    count: number;
    prefix?: string;
    type: PromocodeType;
    value: number;
    maxUsages?: number;
    maxUsagesPerUser?: number;
    expiresAt?: string;
    description?: string;
  }): Promise<{ count: number; promocodes: { id: string; code: string; value: number }[] }> {
    const response = await axiosInstance.post<ApiResponse<{ count: number; promocodes: { id: string; code: string; value: number }[] }>>(
      '/admin/promocodes/generate',
      data
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to generate promocodes');
  }

  async getPromocodeUsages(
    promocodeId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<PromocodeUsage>> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    const response = await axiosInstance.get<ApiResponse<{ usages: PromocodeUsage[]; pagination: PaginatedResponse<PromocodeUsage>['pagination'] }>>(
      `/admin/promocodes/${promocodeId}/usages?${params}`
    );

    if (response.data.success && response.data.data) {
      return {
        items: response.data.data.usages,
        pagination: response.data.data.pagination,
      };
    }
    throw new Error(response.data.error || 'Failed to get promocode usages');
  }
}

export const adminApiService = new AdminApiService();
