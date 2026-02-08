import { create } from 'zustand';
import { adminApiService } from '../services/admin-api.service';
import type { AdminUser, User, Promocode, PaginatedResponse } from '../types';

interface AuthState {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

interface UsersState {
  users: User[];
  usersPagination: PaginatedResponse<User>['pagination'] | null;
  usersLoading: boolean;
  usersError: string | null;
  fetchUsers: (page?: number, limit?: number, search?: string) => Promise<void>;
  updateUserBalance: (id: string, amount: number, reason: string) => Promise<void>;
}

interface PromocodesState {
  promocodes: Promocode[];
  promocodesPagination: PaginatedResponse<Promocode>['pagination'] | null;
  promocodesLoading: boolean;
  promocodesError: string | null;
  fetchPromocodes: (page?: number, limit?: number, filters?: { search?: string; type?: string; isActive?: boolean }) => Promise<void>;
  createPromocode: (data: Parameters<typeof adminApiService.createPromocode>[0]) => Promise<Promocode>;
  deletePromocode: (id: string) => Promise<void>;
  revokePromocode: (id: string) => Promise<void>;
}

interface StoreState extends AuthState, UsersState, PromocodesState {}

export const useStore = create<StoreState>((set) => ({
  // Auth state
  admin: null,
  isAuthenticated: false,
  authLoading: true,
  authError: null,

  login: async (email: string, password: string) => {
    set({ authLoading: true, authError: null });
    try {
      const { admin } = await adminApiService.login(email, password);
      set({ admin, isAuthenticated: true, authLoading: false });
    } catch (error) {
      set({ authError: error instanceof Error ? error.message : 'Login failed', authLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await adminApiService.logout();
    } finally {
      set({ admin: null, isAuthenticated: false });
    }
  },

  checkAuth: async () => {
    // With httpOnly cookies, we can't check if token exists from JS
    // Just try to get admin info - if it fails, user is not authenticated
    try {
      const admin = await adminApiService.getMe();
      set({ admin, isAuthenticated: true, authLoading: false });
    } catch {
      set({ admin: null, isAuthenticated: false, authLoading: false });
    }
  },

  clearError: () => set({ authError: null, usersError: null, promocodesError: null }),

  // Users state
  users: [],
  usersPagination: null,
  usersLoading: false,
  usersError: null,

  fetchUsers: async (page = 1, limit = 20, search?: string) => {
    set({ usersLoading: true, usersError: null });
    try {
      const response = await adminApiService.getUsers(page, limit, search);
      set({
        users: response.items,
        usersPagination: response.pagination,
        usersLoading: false,
      });
    } catch (error) {
      set({ usersError: error instanceof Error ? error.message : 'Failed to fetch users', usersLoading: false });
    }
  },

  updateUserBalance: async (id: string, amount: number, reason: string) => {
    try {
      const updatedUser = await adminApiService.updateUserBalance(id, amount, reason);
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updatedUser : u)),
      }));
    } catch (error) {
      set({ usersError: error instanceof Error ? error.message : 'Failed to update balance' });
      throw error;
    }
  },

  // Promocodes state
  promocodes: [],
  promocodesPagination: null,
  promocodesLoading: false,
  promocodesError: null,

  fetchPromocodes: async (page = 1, limit = 20, filters?) => {
    set({ promocodesLoading: true, promocodesError: null });
    try {
      const response = await adminApiService.getPromocodes(page, limit, filters as Parameters<typeof adminApiService.getPromocodes>[2]);
      set({
        promocodes: response.items,
        promocodesPagination: response.pagination,
        promocodesLoading: false,
      });
    } catch (error) {
      set({ promocodesError: error instanceof Error ? error.message : 'Failed to fetch promocodes', promocodesLoading: false });
    }
  },

  createPromocode: async (data) => {
    const promocode = await adminApiService.createPromocode(data);
    set((state) => ({
      promocodes: [promocode, ...state.promocodes],
    }));
    return promocode;
  },

  deletePromocode: async (id: string) => {
    await adminApiService.deletePromocode(id);
    set((state) => ({
      promocodes: state.promocodes.filter((p) => p.id !== id),
    }));
  },

  revokePromocode: async (id: string) => {
    const promocode = await adminApiService.revokePromocode(id);
    set((state) => ({
      promocodes: state.promocodes.map((p) => (p.id === id ? promocode : p)),
    }));
  },
}));
