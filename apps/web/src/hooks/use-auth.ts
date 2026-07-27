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
import type { LoginCredentials, RegisterPayload } from '@/types';

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, login, logout } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const tokens = await authService.login(credentials);
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
      router.push('/dashboard');
    },
    onError: (error: any) => {
      const serverMessage = error?.response?.data?.message;
      const description =
        typeof serverMessage === 'string'
          ? serverMessage
          : 'Invalid email or password. Please try again.';
      toast.error('Login failed', { description });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      console.log('[useAuth register] Initiating registration request with payload:', {
        ...payload,
        password: '***',
      });
      const user = await authService.register(payload);
      console.log('[useAuth register] Registration succeeded for user:', user);
      return user;
    },
    onSuccess: (user) => {
      console.log('[useAuth register onSuccess]: Successfully registered user email:', user?.email);
      toast.success('Account created!', {
        description: 'Account created successfully! Please sign in.',
      });
      router.push('/login');
    },
    onError: (error: any) => {
      console.error('[useAuth register onError] Axios error object:', error);
      console.error('[useAuth register onError] Response status:', error?.response?.status);
      console.error('[useAuth register onError] Response body:', error?.response?.data);

      const serverMessage = error?.response?.data?.message;
      const serverDetails = error?.response?.data?.details;
      let description = 'An error occurred during registration. Please try again.';

      if (Array.isArray(serverDetails) && serverDetails.length > 0) {
        description = serverDetails
          .map((d: any) => d.message || `${d.field} is invalid`)
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
