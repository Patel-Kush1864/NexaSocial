// ═══════════════════════════════════════════
// NexaSocial — User API Service
// ═══════════════════════════════════════════

import apiClient from '@/lib/api-client';
import type { User, UserSession } from '@/types';

export const userService = {
  async getProfile(): Promise<User> {
    const { data } = await apiClient.get<User>('/users/profile');
    return data;
  },

  async updateProfile(payload: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    timezone?: string;
  }): Promise<User> {
    // Backend only supports firstName and lastName for now
    const { firstName, lastName } = payload;
    const { data } = await apiClient.put<User>('/users/profile', { firstName, lastName });
    return data;
  },

  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<User>(
      '/users/avatar',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return data;
  },

  async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    const { data } = await apiClient.put<{ message: string }>(
      '/users/change-password',
      payload,
    );
    return data;
  },

  async getSessions(): Promise<UserSession[]> {
    const { data } = await apiClient.get<UserSession[]>('/users/sessions');
    return data;
  },

  async revokeSession(sessionId: string): Promise<{ message: string }> {
    const { data } = await apiClient.delete<{ message: string }>(
      `/users/sessions/${sessionId}`,
    );
    return data;
  },
};
