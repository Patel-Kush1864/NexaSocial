// ═══════════════════════════════════════════
// NexaSocial — Auth Zustand Store
// ═══════════════════════════════════════════

import { create } from 'zustand';
import type { User, Scope } from '@/types';

interface AuthState {
  user: User | null;
  scope: Scope | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User) => void;
  logout: () => void;
  setAuth: (accessToken: string, refreshToken: string) => void;
  
  // Permission Helpers
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  scope: null,
  isAuthenticated: false,
  isLoading: true, // Start true — we check session on mount

  setUser: (user) => {
    let scope: Scope | null = null;
    if (user) {
      scope = ['SUPER_ADMIN', 'ADMIN'].includes(user.role) ? 'PLATFORM' : 'WORKSPACE';
    }
    set({
      user,
      scope,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  login: (user) => {
    const scope = ['SUPER_ADMIN', 'ADMIN'].includes(user.role) ? 'PLATFORM' : 'WORKSPACE';
    set({
      user,
      scope,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nexasocial_refresh_token');
      localStorage.removeItem('nexasocial_access_token');
      localStorage.removeItem('nexasocial-workspace');
    }
    set({
      user: null,
      scope: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setAuth: (accessToken, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexasocial_access_token', accessToken);
      localStorage.setItem('nexasocial_refresh_token', refreshToken);
    }
  },

  hasPermission: (permission: string) => {
    const user = get().user;
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return user.permissions?.includes(permission) ?? false;
  },

  hasAnyPermission: (permissions: string[]) => {
    const user = get().user;
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return permissions.some(p => user.permissions?.includes(p));
  },
}));
