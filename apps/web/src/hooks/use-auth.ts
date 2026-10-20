/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

// ═══════════════════════════════════════════
// NexaSocial — Auth Hook
// ═══════════════════════════════════════════

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { setAccessToken } from '@/lib/api-client';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import type { ApiError, LoginCredentials, RegisterPayload } from '@/types';

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, login, logout, setUser } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const normalizedCredentials = {
        ...credentials,
        email: credentials.email.trim().toLowerCase(),
      };
      const tokens = await authService.login(normalizedCredentials);
      setAccessToken(tokens.accessToken);
      localStorage.setItem('nexasocial_refresh_token', tokens.refreshToken);

      const profile = await userService.getProfile();
      return profile;
    },
    onSuccess: (profile) => {
      login(profile);
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
      console.log('[useAuth register] Initiating registration request with payload:', {
        ...payload,
        password: '***',
      });
      const registeredUser = await authService.register(payload);

      // Auto-login registered user using existing login workflow
      const normalizedCredentials = {
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
      };
      const tokens = await authService.login(normalizedCredentials);
      setAccessToken(tokens.accessToken);
      localStorage.setItem('nexasocial_refresh_token', tokens.refreshToken);

      try {
        const profile = await userService.getProfile();
        return profile;
      } catch (profileErr) {
        console.warn(
          'Could not fetch profile, falling back to registration details:',
          profileErr,
        );
        return {
          id: registeredUser.id,
          firstName: registeredUser.firstName || payload.firstName,
          lastName: registeredUser.lastName || payload.lastName,
          email: registeredUser.email || payload.email,
          role: 'CREATOR',
          permissions: [],
          isActive: true,
          workspaces: 0,
          connectedAccounts: 0,
          subscription: 'None',
        } as any;
      }
    },
    onSuccess: (profile) => {
      login(profile);
      toast.success('Welcome to NexaSocial!', {
        description: `Account created for ${profile.firstName}!`,
      });

      if (typeof window !== 'undefined') {
        const pendingToken = localStorage.getItem('pending_invitation_token');
        if (pendingToken) {
          localStorage.removeItem('pending_invitation_token');
          router.push(`/invitations/accept?token=${pendingToken}`);
          return;
        }
      }

      router.push('/dashboard');
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
