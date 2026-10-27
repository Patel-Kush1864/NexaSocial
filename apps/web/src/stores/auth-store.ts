// ═══════════════════════════════════════════
// NexaSocial — Auth Zustand Store
// ═══════════════════════════════════════════

import { create } from 'zustand';
import type { User, Scope, WorkspaceRole } from '@/types';
import { useWorkspaceStore } from './workspace-store';

export const WORKSPACE_ROLE_PERMISSIONS: Record<WorkspaceRole, string[]> = {
  OWNER: [
    'dashboard.view',
    'workspace.view',
    'workspace.manage',
    'workspace.dashboard.view',
    'workspace.settings.view',
    'workspace.settings.manage',
    'team.members.view',
    'team.members.invite',
    'team.members.update',
    'team.members.remove',
    'team.roles.assign',
    'workspace.members.view',
    'workspace.members.manage',
    'social_accounts.view',
    'social_accounts.connect',
    'social_accounts.manage',
    'workspace.social_accounts.view',
    'workspace.social_accounts.manage',
    'livestreams.view',
    'livestreams.create',
    'livestreams.update',
    'livestreams.start',
    'livestreams.stop',
    'livestreams.delete',
    'workspace.livestreams.view',
    'workspace.livestreams.manage',
    'content.view',
    'content.create',
    'content.update',
    'content.delete',
    'content.publish',
    'content.schedule',
    'workspace.content.view',
    'workspace.content.manage',
    'media.view',
    'media.upload',
    'media.delete',
    'workspace.media.view',
    'workspace.media.manage',
    'analytics.view',
    'workspace.analytics.view',
    'notifications.view',
    'workspace.notifications.view',
    'workspace.notifications.manage',
    'subscription.view',
    'subscription.manage',
    'billing.view',
    'billing.manage',
    'workspace.subscription.view',
    'workspace.subscription.manage',
  ],
  MANAGER: [
    'dashboard.view',
    'workspace.view',
    'workspace.dashboard.view',
    'workspace.settings.view',
    'team.members.view',
    'team.members.invite',
    'team.members.update',
    'team.members.remove',
    'workspace.members.view',
    'workspace.members.manage',
    'social_accounts.view',
    'social_accounts.connect',
    'social_accounts.manage',
    'workspace.social_accounts.view',
    'workspace.social_accounts.manage',
    'livestreams.view',
    'livestreams.create',
    'livestreams.update',
    'livestreams.start',
    'livestreams.stop',
    'livestreams.delete',
    'workspace.livestreams.view',
    'workspace.livestreams.manage',
    'content.view',
    'content.create',
    'content.update',
    'content.delete',
    'content.publish',
    'content.schedule',
    'workspace.content.view',
    'workspace.content.manage',
    'media.view',
    'media.upload',
    'media.delete',
    'workspace.media.view',
    'workspace.media.manage',
    'analytics.view',
    'workspace.analytics.view',
    'notifications.view',
    'workspace.notifications.view',
    'workspace.notifications.manage',
  ],
  CREATOR: [
    'dashboard.view',
    'workspace.view',
    'workspace.dashboard.view',
    'content.view',
    'content.create',
    'content.update',
    'content.delete',
    'content.publish',
    'content.schedule',
    'workspace.content.view',
    'workspace.content.manage',
    'media.view',
    'media.upload',
    'media.delete',
    'workspace.media.view',
    'workspace.media.manage',
    'livestreams.view',
    'livestreams.create',
    'livestreams.update',
    'livestreams.start',
    'livestreams.stop',
    'workspace.livestreams.view',
    'social_accounts.view',
    'workspace.social_accounts.view',
    'analytics.view',
    'workspace.analytics.view',
    'notifications.view',
    'workspace.notifications.view',
  ],
  VIEWER: [
    'dashboard.view',
    'workspace.view',
    'workspace.dashboard.view',
    'social_accounts.view',
    'workspace.social_accounts.view',
    'livestreams.view',
    'workspace.livestreams.view',
    'content.view',
    'workspace.content.view',
    'media.view',
    'workspace.media.view',
    'analytics.view',
    'workspace.analytics.view',
    'notifications.view',
    'workspace.notifications.view',
  ],
};

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
    let normalizedUser: User | null = user;
    if (user) {
      const roleStr =
        typeof user.role === 'object' && user.role !== null
          ? ((user.role as any).name as any)
          : user.role;
      scope = ['SUPER_ADMIN', 'ADMIN'].includes(roleStr) ? 'PLATFORM' : 'WORKSPACE';
      normalizedUser = {
        ...user,
        role: roleStr,
        permissions:
          user.permissions ||
          (typeof user.role === 'object' && (user.role as any)?.permissions
            ? (user.role as any).permissions.map((p: any) => p.key || p)
            : []),
      };
    }
    set({
      user: normalizedUser,
      scope,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  login: (user) => {
    const roleStr =
      typeof user.role === 'object' && user.role !== null
        ? ((user.role as any).name as any)
        : user.role;
    const scope = ['SUPER_ADMIN', 'ADMIN'].includes(roleStr) ? 'PLATFORM' : 'WORKSPACE';
    const normalizedUser = {
      ...user,
      role: roleStr,
      permissions:
        user.permissions ||
        (typeof user.role === 'object' && (user.role as any)?.permissions
          ? (user.role as any).permissions.map((p: any) => p.key || p)
          : []),
    };
    set({
      user: normalizedUser,
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
    useWorkspaceStore.getState().setCurrentWorkspace(null);
    useWorkspaceStore.getState().setWorkspaces([]);
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
    const roleStr =
      typeof user.role === 'object' && user.role !== null
        ? ((user.role as any).name as any)
        : user.role;
    if (roleStr === 'SUPER_ADMIN') return true;

    // Platform-level permissions check
    if (permission.startsWith('platform.')) {
      return user.permissions?.includes(permission) ?? false;
    }

    // Active workspace RBAC check
    try {
      const currentWorkspace = useWorkspaceStore.getState().currentWorkspace;
      if (currentWorkspace) {
        // If workspace has explicitly loaded permissions
        if (currentWorkspace.permissions && currentWorkspace.permissions.length > 0) {
          return currentWorkspace.permissions.includes(permission);
        }
        // If workspace has role assigned
        const role =
          currentWorkspace.role ||
          (currentWorkspace.ownerId === user.id ? 'OWNER' : 'CREATOR');
        const rolePerms = WORKSPACE_ROLE_PERMISSIONS[role];
        if (rolePerms) {
          return rolePerms.includes(permission);
        }
      }
    } catch {
      // In case store is initializing
    }

    return user.permissions?.includes(permission) ?? false;
  },

  hasAnyPermission: (permissions: string[]) => {
    const user = get().user;
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return permissions.some(p => get().hasPermission(p));
  },
}));

