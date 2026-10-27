/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

// ═══════════════════════════════════════════
// NexaSocial — Auth Hook
// ═══════════════════════════════════════════

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { workspaceService } from '@/services/workspace.service';
import { setAccessToken } from '@/lib/api-client';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import type { ApiError, LoginCredentials, RegisterPayload } from '@/types';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading, login, logout, setUser } = useAuthStore();
  const { setWorkspaces } = useWorkspaceStore();

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      // Clear any previous session state to prevent cross-contamination
      if (typeof window !== 'undefined') {
        localStorage.removeItem('nexasocial-workspace');
      }
      useWorkspaceStore.getState().setCurrentWorkspace(null);
      useWorkspaceStore.getState().setWorkspaces([]);
      queryClient.clear();

      const normalizedCredentials = {
        ...credentials,
        email: credentials.email.trim().toLowerCase(),
      };
      const tokens = await authService.login(normalizedCredentials);
      setAccessToken(tokens.accessToken);
      localStorage.setItem('nexasocial_refresh_token', tokens.refreshToken);

      const profile = await userService.getProfile();

      try {
        const userWorkspaces = await workspaceService.getAll();
        setWorkspaces(userWorkspaces);
      } catch (wsErr) {
        console.warn('Could not refresh workspaces on login:', wsErr);
      }

      return profile;
    },
    onSuccess: async (profile) => {
      login(profile);
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      await queryClient.invalidateQueries({ queryKey: ['subscriptions', 'entitlements'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      toast.success('Welcome back!', {
        description: `Logged in as ${profile.firstName}`,
      });

      if (typeof window !== 'undefined') {
        const pendingToken = localStorage.getItem('pending_invitation_token');
        if (pendingToken) {
          localStorage.removeItem('pending_invitation_token');
          router.push(`/invitations/accept?token=${pendingToken}`);
          return;
        }
      }

      // Check user type and route correctly
      const isPlatformAdmin = profile.role === 'SUPER_ADMIN' || profile.role === 'ADMIN';
      if (isPlatformAdmin) {
        router.push('/dashboard');
        return;
      }

      const store = useWorkspaceStore.getState();
      const currentWs = store.currentWorkspace;
      const userWorkspaces = store.workspaces;

      // Only route to billing if user is an un-onboarded owner with no workspace
      const isOwner = profile.role === 'WORKSPACE_OWNER' || (currentWs?.ownerId === profile.id);
      if (isOwner && (!currentWs || userWorkspaces.length === 0)) {
        router.push('/billing');
        return;
      }

      router.push('/dashboard');
    },
    onError: (error: AxiosError<ApiError>) => {
      const serverMessage = error?.response?.data?.message;
      let description = 'Invalid email or password. Please try again.';

      if (typeof serverMessage === 'string') {
        description = serverMessage;
      } else if (Array.isArray(serverMessage)) {
        description = serverMessage.join(', ');
      } else if (
        error?.code === 'ERR_NETWORK' ||
        error?.code === 'ECONNREFUSED' ||
        !error?.response ||
        error?.response?.status >= 500
      ) {
        description =
          'Unable to connect to the backend server. The server may be starting up or offline. Please try again in a moment.';
      }

      toast.error('Login failed', { description });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const storedPendingToken =
        typeof window !== 'undefined'
          ? localStorage.getItem('pending_invitation_token') || undefined
          : undefined;

      const finalPayload: RegisterPayload = {
        ...payload,
        invitationToken: payload.invitationToken || storedPendingToken,
      };

      console.log('[useAuth register] Initiating registration request with payload:', {
        ...finalPayload,
        password: '***',
      });
      const registeredUser = await authService.register(finalPayload);

      // Auto-login registered user using existing login workflow
      const normalizedCredentials = {
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
      };
      const tokens = await authService.login(normalizedCredentials);
      setAccessToken(tokens.accessToken);
      localStorage.setItem('nexasocial_refresh_token', tokens.refreshToken);

      let profile: any;
      try {
        profile = await userService.getProfile();
      } catch (profileErr) {
        console.warn(
          'Could not fetch profile, falling back to registration details:',
          profileErr,
        );
        profile = {
          id: registeredUser.id,
          firstName: registeredUser.firstName || payload.firstName,
          lastName: registeredUser.lastName || payload.lastName,
          email: registeredUser.email || payload.email,
          role: (registeredUser as any)?.isInvited ? 'CREATOR' : 'WORKSPACE_OWNER',
          permissions: [],
          isActive: true,
          workspaces: (registeredUser as any)?.workspaceId ? 1 : 0,
          connectedAccounts: 0,
          subscription: 'None',
        } as any;
      }

      // Pre-load workspaces for the newly registered user
      try {
        const userWorkspaces = await workspaceService.getAll();
        setWorkspaces(userWorkspaces);
      } catch (wsErr) {
        console.warn('Could not pre-fetch workspaces:', wsErr);
      }

      const isInvited =
        Boolean((registeredUser as any)?.isInvited) || Boolean(finalPayload.invitationToken);

      return {
        profile,
        isInvited,
      };
    },
    onSuccess: async ({ profile, isInvited }) => {
      login(profile);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pending_invitation_token');
      }

      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      await queryClient.invalidateQueries({ queryKey: ['subscriptions', 'entitlements'] });

      if (isInvited) {
        toast.success('Your invitation has been accepted. Welcome to the workspace!');
        router.push('/dashboard');
        return;
      }

      // New public workspace owner: redirect to plan selection page
      toast.success('Welcome to NexaSocial!', {
        description:
          "Your account has been created successfully. Choose a subscription plan to get started. After your subscription is successfully activated, you'll be able to create your workspace and access the features included in your plan.",
      });
      router.push('/billing');
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('[useAuth register onError] Axios error object:', error);
      console.error('[useAuth register onError] Response status:', error?.response?.status);
      console.error('[useAuth register onError] Response body:', error?.response?.data);

      const serverMessage = error?.response?.data?.message;
      const serverDetails = error?.response?.data?.details;
      let description = 'An error occurred during registration. Please try again.';

      if (Array.isArray(serverDetails) && serverDetails.length > 0) {
        description = serverDetails
          .map((d: { field?: string; message?: string }) => d.message || `${d.field} is invalid`)
          .join(', ');
      } else if (Array.isArray(serverMessage)) {
        description = serverMessage.join(', ');
      } else if (typeof serverMessage === 'string' && serverMessage.trim().length > 0) {
        description = serverMessage;
      } else if (error?.message) {
        description = error.message;
      }

      console.log('[useAuth register onError] Toast description rendered:', description);
      toast.error('Registration failed', { description });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await authService.logout();
    },
    onSettled: () => {
      setAccessToken(null);
      queryClient.clear();
      logout();
      router.push('/login');
      toast.success('Logged out successfully');
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      return authService.forgotPassword(email);
    },
    onSuccess: () => {
      toast.success('Email sent!', {
        description: 'Check your inbox for password reset instructions.',
      });
    },
    onError: () => {
      toast.error('Failed to send reset email');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({
      token,
      password,
    }: {
      token: string;
      password: string;
    }) => {
      return authService.resetPassword(token, password);
    },
    onSuccess: () => {
      toast.success('Password reset!', {
        description: 'You can now log in with your new password.',
      });
      router.push('/login');
    },
    onError: () => {
      toast.error('Failed to reset password', {
        description: 'The reset link may have expired.',
      });
    },
  });

  return {
    user,
    setUser,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
    isForgotPending: forgotPasswordMutation.isPending,
    isResetPending: resetPasswordMutation.isPending,
  };
}
