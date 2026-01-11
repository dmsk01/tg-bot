import { StateCreator } from 'zustand';
import type { User, UserSettings } from '@/types';
import { apiService } from '@/services/api.service';

export interface UserSlice {
  user: User | null;
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  updateLanguage: (lang: string) => Promise<void>;
  confirmAge: () => Promise<void>;
  refreshBalance: () => Promise<void>;
}

export const createUserSlice: StateCreator<UserSlice> = (set, get) => ({
  user: null,
  settings: null,
  isLoading: false,
  error: null,

  fetchUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await apiService.getMe();
      set({ user, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchSettings: async () => {
    try {
      const settings = await apiService.getSettings();
      set({ settings });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  },

  updateLanguage: async (lang: string) => {
    try {
      await apiService.updateLanguage(lang);
      const user = get().user;
      if (user) {
        set({ user: { ...user, languageCode: lang } });
      }
    } catch (error) {
      console.error('Failed to update language:', error);
    }
  },

  confirmAge: async () => {
    try {
      await apiService.confirmAge();
      const user = get().user;
      if (user) {
        set({ user: { ...user, isAgeConfirmed: true } });
      }
    } catch (error) {
      console.error('Failed to confirm age:', error);
    }
  },

  refreshBalance: async () => {
    try {
      const balance = await apiService.getBalance();
      const user = get().user;
      if (user) {
        set({ user: { ...user, balance } });
      }
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  },
});
