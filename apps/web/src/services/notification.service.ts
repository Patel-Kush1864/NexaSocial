// ═══════════════════════════════════════════
// NexaSocial — Notification API Service
// ═══════════════════════════════════════════

import apiClient from '@/lib/api-client';
import type { Notification, SuccessResponse } from '@/types';

export const notificationService = {
  async getAll(params?: {
    workspaceId?: string;
    isRead?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Notification[]> {
    const { data } = await apiClient.get<Notification[]>('/notifications', {
      params,
    });
    return data;
  },

  async getUnreadCount(workspaceId?: string): Promise<{ unreadCount: number }> {
    const { data } = await apiClient.get<{ unreadCount: number }>(
      '/notifications/unread-count',
      { params: { workspaceId } },
    );
    return data;
  },

  async markAsRead(id: string): Promise<Notification> {
    const { data } = await apiClient.patch<Notification>(
      `/notifications/${id}/read`,
    );
    return data;
  },

  async markAllAsRead(workspaceId?: string) {
    const { data } = await apiClient.patch('/notifications/read-all', null, {
      params: { workspaceId },
    });
    return data;
  },

  async delete(id: string): Promise<SuccessResponse> {
    const { data } = await apiClient.delete<SuccessResponse>(
      `/notifications/${id}`,
    );
    return data;
  },
};
