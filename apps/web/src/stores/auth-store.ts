// ═══════════════════════════════════════════
// NexaSocial — Auth Zustand Store
// ═══════════════════════════════════════════

import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start true — we check session on mount

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  login: (user) =>
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nexasocial_refresh_token');
    }
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));
