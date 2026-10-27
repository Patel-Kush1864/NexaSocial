'use client';

// ═══════════════════════════════════════════
// NexaSocial — Auth Provider
// ═══════════════════════════════════════════

import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { workspaceService } from '@/services/workspace.service';
import { setAccessToken } from '@/lib/api-client';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading } = useAuthStore();
  const { setWorkspaces } = useWorkspaceStore();

  useEffect(() => {
    async function initAuth() {
      try {
        // Try to get refresh token from storage
        const refreshToken = localStorage.getItem('nexasocial_refresh_token');

        if (!refreshToken) {
          setUser(null);
          return;
        }

        // Attempt to refresh the access token
        const tokens = await authService.refresh(refreshToken);
        setAccessToken(tokens.accessToken);
        localStorage.setItem('nexasocial_refresh_token', tokens.refreshToken);

        // Fetch user profile
        const profile = await userService.getProfile();
        setUser(profile);

        // Rehydrate user's workspaces
        try {
          const userWorkspaces = await workspaceService.getAll();
          setWorkspaces(userWorkspaces);
        } catch (wsErr) {
          console.warn('Could not rehydrate workspaces on auth init:', wsErr);
        }
      } catch {
        // Invalid/expired refresh token — clear and mark as unauthenticated
        localStorage.removeItem('nexasocial_refresh_token');
        setAccessToken(null);
        setUser(null);
      }
    }

    setLoading(true);
    initAuth();
  }, [setUser, setLoading, setWorkspaces]);

  return <>{children}</>;
}
