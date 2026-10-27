// ═══════════════════════════════════════════
// NexaSocial — Notification Zustand Store
// ═══════════════════════════════════════════

import { create } from 'zustand';
import type { Notification } from '@/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isDropdownOpen: boolean;

  // Actions
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  setDropdownOpen: (open: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isDropdownOpen: false,

  setNotifications: (notifications) =>
    set({
      notifications: Array.isArray(notifications)
        ? notifications
        : Array.isArray((notifications as any)?.data)
        ? (notifications as any).data
        : [],
    }),

  setUnreadCount: (count) =>
    set({ unreadCount: typeof count === 'number' && !isNaN(count) ? count : 0 }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        notification,
        ...(Array.isArray(state.notifications) ? state.notifications : []),
      ],
      unreadCount: state.unreadCount + 1,
    })),

  markAsRead: (id) =>
    set((state) => {
      const list = Array.isArray(state.notifications) ? state.notifications : [];
      return {
        notifications: list.map((n) =>
          n.id === id ? { ...n, isRead: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    }),

  markAllAsRead: () =>
    set((state) => {
      const list = Array.isArray(state.notifications) ? state.notifications : [];
      return {
        notifications: list.map((n) => ({
          ...n,
          isRead: true,
        })),
        unreadCount: 0,
      };
    }),

  removeNotification: (id) =>
    set((state) => {
      const list = Array.isArray(state.notifications) ? state.notifications : [];
      const notification = list.find((n) => n.id === id);
      return {
        notifications: list.filter((n) => n.id !== id),
        unreadCount:
          notification && !notification.isRead
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
      };
    }),

  setDropdownOpen: (open) => set({ isDropdownOpen: open }),
}));
