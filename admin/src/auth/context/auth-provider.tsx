import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useStore } from '../../store/store';
import type { AdminUser } from '../../types';

interface AuthContextValue {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const admin = useStore((state) => state.admin);
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const authLoading = useStore((state) => state.authLoading);
  const login = useStore((state) => state.login);
  const logout = useStore((state) => state.logout);
  const checkAuth = useStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ admin, isAuthenticated, isLoading: authLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
