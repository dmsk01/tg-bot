import { create } from 'zustand';
import { adminApiService } from '../services/admin-api.service';
import type { AdminUser, User, UserDetail, Promocode, PaginatedResponse, Generation, Transaction, AdminLog, ExportFormat } from '../types';

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

interface UserDetailState {
  currentUser: UserDetail | null;
  userGenerations: Generation[];
  userGenerationsPagination: PaginatedResponse<Generation>['pagination'] | null;
  userTransactions: Transaction[];
  userTransactionsPagination: PaginatedResponse<Transaction>['pagination'] | null;
  userLogs: AdminLog[];
  userLogsPagination: PaginatedResponse<AdminLog>['pagination'] | null;
  userDetailLoading: boolean;
  userDetailError: string | null;
  fetchUserDetail: (id: string) => Promise<void>;
  fetchUserGenerations: (id: string, page?: number, limit?: number) => Promise<void>;
  fetchUserTransactions: (id: string, page?: number, limit?: number) => Promise<void>;
  fetchUserLogs: (id: string, page?: number, limit?: number) => Promise<void>;
  updateCurrentUserBalance: (id: string, amount: number, reason: string) => Promise<void>;
  toggleUserBlock: (id: string) => Promise<void>;
  exportUserData: (id: string, type: 'generations' | 'transactions' | 'logs', format: ExportFormat) => Promise<void>;
  clearUserDetail: () => void;
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

interface StoreState extends AuthState, UsersState, UserDetailState, PromocodesState {}

export const useStore = create<StoreState>((set, get) => ({
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
    try {
      const admin = await adminApiService.getMe();
      set({ admin, isAuthenticated: true, authLoading: false });
    } catch {
      set({ admin: null, isAuthenticated: false, authLoading: false });
    }
  },

  clearError: () => set({ authError: null, usersError: null, promocodesError: null, userDetailError: null }),

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

  // User Detail state
  currentUser: null,
  userGenerations: [],
  userGenerationsPagination: null,
  userTransactions: [],
  userTransactionsPagination: null,
  userLogs: [],
  userLogsPagination: null,
  userDetailLoading: false,
  userDetailError: null,

  fetchUserDetail: async (id: string) => {
    set({ userDetailLoading: true, userDetailError: null });
    try {
      const user = await adminApiService.getUser(id);
      set({ currentUser: user, userDetailLoading: false });
    } catch (error) {
      set({ userDetailError: error instanceof Error ? error.message : 'Failed to fetch user', userDetailLoading: false });
    }
  },

  fetchUserGenerations: async (id: string, page = 1, limit = 20) => {
    try {
      const response = await adminApiService.getUserGenerations(id, page, limit);
      set({
        userGenerations: response.items,
        userGenerationsPagination: response.pagination,
      });
    } catch (error) {
      set({ userDetailError: error instanceof Error ? error.message : 'Failed to fetch generations' });
    }
  },

  fetchUserTransactions: async (id: string, page = 1, limit = 20) => {
    try {
      const response = await adminApiService.getUserTransactions(id, page, limit);
      set({
        userTransactions: response.items,
        userTransactionsPagination: response.pagination,
      });
    } catch (error) {
      set({ userDetailError: error instanceof Error ? error.message : 'Failed to fetch transactions' });
    }
  },

  fetchUserLogs: async (id: string, page = 1, limit = 20) => {
    try {
      const response = await adminApiService.getUserLogs(id, page, limit);
      set({
        userLogs: response.items,
        userLogsPagination: response.pagination,
      });
    } catch (error) {
      set({ userDetailError: error instanceof Error ? error.message : 'Failed to fetch logs' });
    }
  },

  updateCurrentUserBalance: async (id: string, amount: number, reason: string) => {
    try {
      const updatedUser = await adminApiService.updateUserBalance(id, amount, reason);
      set({ currentUser: { ...get().currentUser, ...updatedUser } as UserDetail });
    } catch (error) {
      set({ userDetailError: error instanceof Error ? error.message : 'Failed to update balance' });
      throw error;
    }
  },

  toggleUserBlock: async (id: string) => {
    const currentUser = get().currentUser;
    if (!currentUser) return;

    try {
      const updatedUser = await adminApiService.updateUser(id, { isBlocked: !currentUser.isBlocked });
      set({ currentUser: { ...currentUser, ...updatedUser } as UserDetail });
    } catch (error) {
      set({ userDetailError: error instanceof Error ? error.message : 'Failed to update user' });
      throw error;
    }
  },

  exportUserData: async (id: string, type: 'generations' | 'transactions' | 'logs', format: ExportFormat) => {
    try {
      let blob: Blob;
      let filename: string;
      const user = get().currentUser;
      const telegramId = user?.telegramId || id;
      const date = new Date().toISOString().split('T')[0];

      switch (type) {
        case 'generations':
          blob = await adminApiService.exportUserGenerations(id, format);
          filename = `user_${telegramId}_generations_${date}.${format}`;
          break;
        case 'transactions':
          blob = await adminApiService.exportUserTransactions(id, format);
          filename = `user_${telegramId}_transactions_${date}.${format}`;
          break;
        case 'logs':
          blob = await adminApiService.exportUserLogs(id, format);
          filename = `user_${telegramId}_logs_${date}.${format}`;
          break;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      set({ userDetailError: error instanceof Error ? error.message : 'Failed to export data' });
      throw error;
    }
  },

  clearUserDetail: () => set({
    currentUser: null,
    userGenerations: [],
    userGenerationsPagination: null,
    userTransactions: [],
    userTransactionsPagination: null,
    userLogs: [],
    userLogsPagination: null,
    userDetailError: null,
  }),

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
