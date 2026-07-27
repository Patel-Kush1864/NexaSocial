// ═══════════════════════════════════════════
// NexaSocial — TanStack Query Client Config
// ═══════════════════════════════════════════

import { QueryClient } from '@tanstack/react-query';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes (garbage collection)
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

// ── Query Keys Factory ────────────────────
export const queryKeys = {
  // Auth
  auth: {
    me: ['auth', 'me'] as const,
  },

  // Users
  users: {
    profile: ['users', 'profile'] as const,
    sessions: ['users', 'sessions'] as const,
  },

  // Workspaces
  workspaces: {
    all: ['workspaces'] as const,
    detail: (id: string) => ['workspaces', id] as const,
    members: (id: string) => ['workspaces', id, 'members'] as const,
    dashboard: (id: string) => ['workspaces', id, 'dashboard'] as const,
  },

  // Social
  social: {
    platforms: ['social', 'platforms'] as const,
    accounts: (workspaceId: string) =>
      ['social', 'accounts', workspaceId] as const,
    account: (accountId: string) => ['social', 'accounts', accountId] as const,
  },

  // Livestreams
  streams: {
    all: (workspaceId: string) => ['streams', workspaceId] as const,
    detail: (id: string) => ['streams', 'detail', id] as const,
    history: (workspaceId: string) =>
      ['streams', 'history', workspaceId] as const,
    dashboard: (workspaceId: string) =>
      ['streams', 'dashboard', workspaceId] as const,
  },

  // Dashboard
  dashboard: {
    summary: (workspaceId: string) =>
      ['dashboard', 'summary', workspaceId] as const,
    statistics: (workspaceId: string) =>
      ['dashboard', 'statistics', workspaceId] as const,
    widgets: (workspaceId: string, widget?: string) =>
      ['dashboard', 'widgets', workspaceId, widget] as const,
  },

  // Notifications
  notifications: {
    all: (workspaceId?: string) => ['notifications', workspaceId] as const,
    unreadCount: (workspaceId?: string) =>
      ['notifications', 'unread', workspaceId] as const,
  },

  // Subscriptions
  subscriptions: {
    current: ['subscriptions', 'current'] as const,
    history: ['subscriptions', 'history'] as const,
  },

  // Payments
  payments: {
    history: ['payments', 'history'] as const,
  },

  // Plans
  plans: {
    all: ['plans'] as const,
  },

  // Admin
  admin: {
    dashboard: ['admin', 'dashboard'] as const,
    users: (limit?: number, offset?: number) =>
      ['admin', 'users', limit, offset] as const,
    user: (id: string) => ['admin', 'users', id] as const,
    workspaces: (limit?: number, offset?: number) =>
      ['admin', 'workspaces', limit, offset] as const,
    workspace: (id: string) => ['admin', 'workspaces', id] as const,
    plans: ['admin', 'plans'] as const,
    payments: (limit?: number, offset?: number) =>
      ['admin', 'payments', limit, offset] as const,
    refunds: (limit?: number, offset?: number) =>
      ['admin', 'refunds', limit, offset] as const,
    socialPlatforms: ['admin', 'social-platforms'] as const,
    systemHealth: ['admin', 'system-health'] as const,
  },
} as const;
