// ═══════════════════════════════════════════
// NexaSocial — Auth API Service
// ═══════════════════════════════════════════

import apiClient from '@/lib/api-client';
import type {
  User,
  TokenResponse,
  LoginCredentials,
  RegisterPayload,
  CurrentUser,
} from '@/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>(
      '/auth/login',
      credentials,
    );
    return data;
  },

  async register(payload: RegisterPayload): Promise<User> {
    console.log('[authService.register] Sending POST /auth/register with payload:', { ...payload, password: '***' });
    try {
      const { data } = await apiClient.post<User>('/auth/register', payload);
      console.log('[authService.register] Received success response from server:', data);
      return data;
    } catch (error: any) {
      console.error('[authService.register] Caught network/HTTP error:', error?.response?.status, error?.response?.data || error?.message);
      throw error;
    }
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async refresh(refreshToken: string): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>('/auth/refresh', {
      refreshToken,
    });
    return data;
  },

  async getMe(): Promise<CurrentUser> {
    const { data } = await apiClient.get<CurrentUser>('/auth/me');
    return data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>(
      '/auth/forgot-password',
      { email },
    );
    return data;
  },

  async resetPassword(
    token: string,
    password: string,
  ): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>(
      '/auth/reset-password',
      { token, password },
    );
    return data;
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>(
      '/auth/verify-email',
      { token },
    );
    return data;
  },
};
