// ═══════════════════════════════════════════
// NexaSocial — Livestream API Service
// ═══════════════════════════════════════════

import apiClient from '@/lib/api-client';
import type { LiveStream, StreamDashboardStats, SuccessResponse } from '@/types';

export const livestreamService = {
  async create(
    workspaceId: string,
    payload: { title: string; description?: string; platformAccountIds?: string[] },
  ): Promise<LiveStream> {
    const { data } = await apiClient.post<LiveStream>('/livestreams', payload, {
      params: { workspaceId },
    });
    return data;
  },

  async update(
    id: string,
    workspaceId: string,
    payload: { title?: string; description?: string },
  ): Promise<LiveStream> {
    const { data } = await apiClient.put<LiveStream>(
      `/livestreams/${id}`,
      payload,
      { params: { workspaceId } },
    );
    return data;
  },

  async delete(id: string, workspaceId: string): Promise<SuccessResponse> {
    const { data } = await apiClient.delete<SuccessResponse>(
      `/livestreams/${id}`,
      { params: { workspaceId } },
    );
    return data;
  },

  async schedule(
    id: string,
    workspaceId: string,
    scheduledAt: string,
  ): Promise<LiveStream> {
    const { data } = await apiClient.post<LiveStream>(
      `/livestreams/${id}/schedule`,
      { scheduledAt },
      { params: { workspaceId } },
    );
    return data;
  },

  async start(id: string, workspaceId: string): Promise<LiveStream> {
    const { data } = await apiClient.post<LiveStream>(
      `/livestreams/${id}/start`,
      null,
      { params: { workspaceId } },
    );
    return data;
  },

  async stop(id: string, workspaceId: string): Promise<LiveStream> {
    const { data } = await apiClient.post<LiveStream>(
      `/livestreams/${id}/stop`,
      null,
      { params: { workspaceId } },
    );
    return data;
  },

  async getDetails(id: string, workspaceId: string): Promise<LiveStream> {
    const { data } = await apiClient.get<LiveStream>(`/livestreams/${id}`, {
      params: { workspaceId },
    });
    return data;
  },

  async getHistory(workspaceId: string): Promise<LiveStream[]> {
    const { data } = await apiClient.get<LiveStream[]>('/livestreams/history', {
      params: { workspaceId },
    });
    return data;
  },

  async getDashboardStats(
    workspaceId: string,
  ): Promise<StreamDashboardStats> {
    const { data } = await apiClient.get<StreamDashboardStats>(
      '/livestreams/dashboard',
      { params: { workspaceId } },
    );
    return data;
  },
};
