// ═══════════════════════════════════════════
// NexaSocial — Sidebar Zustand Store
// ═══════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;

  // Actions
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleMobile: () => void;
  setMobileOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      isMobileOpen: false,

      toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),

      setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),

      toggleMobile: () =>
        set((state) => ({ isMobileOpen: !state.isMobileOpen })),

      setMobileOpen: (open) => set({ isMobileOpen: open }),
    }),
    {
      name: 'nexasocial-sidebar',
      partialize: (state) => ({
        isCollapsed: state.isCollapsed,
      }),
    },
  ),
);
