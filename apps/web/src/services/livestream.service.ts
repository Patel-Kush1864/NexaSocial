// ═══════════════════════════════════════════
// NexaSocial — Livestream API Service
// ═══════════════════════════════════════════

import apiClient from '@/lib/api-client';
import type {
  LiveStream,
  StreamDashboardStats,
  SuccessResponse,
  FacebookWorkflowStatusResponse,
  InstagramWorkflowStatusResponse,
} from '@/types';

export const livestreamService = {
  async create(
    workspaceId: string,
    payload: {
      title: string;
      description?: string;
      platformAccountIds?: string[];
      connectedAccountIds?: string[];
    },
  ): Promise<LiveStream> {
    const accountIds = payload.connectedAccountIds || payload.platformAccountIds || [];
    const { data } = await apiClient.post<LiveStream>(
      '/livestreams',
      {
        ...payload,
        connectedAccountIds: accountIds,
        platformAccountIds: accountIds,
      },
      {
        params: { workspaceId },
      },
    );
    return data;
  },

  async update(
    id: string,
    workspaceId: string,
    payload: { title?: string; description?: string; youtubeStreamKey?: string; customStreamKey?: string },
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
      {},
      { params: { workspaceId }, timeout: 60000 },
    );
    return data;
  },

  async stop(id: string, workspaceId: string): Promise<LiveStream> {
    const { data } = await apiClient.post<LiveStream>(
      `/livestreams/${id}/stop`,
      {},
      { params: { workspaceId }, timeout: 60000 },
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

  async verifyFacebookSource(
    id: string,
    workspaceId: string,
    payload: {
      platformId?: string;
      streamUrl?: string;
      streamKey?: string;
      customStreamUrl?: string;
      customStreamKey?: string;
    },
  ): Promise<FacebookWorkflowStatusResponse> {
    const { data } = await apiClient.post<FacebookWorkflowStatusResponse>(
      `/livestreams/${id}/facebook/source`,
      payload,
      { params: { workspaceId } },
    );
    return data;
  },

  async syncFacebookMetadata(
    id: string,
    workspaceId: string,
    payload: {
      platformId?: string;
      title?: string;
      description?: string;
      pageId?: string;
    },
  ): Promise<FacebookWorkflowStatusResponse> {
    const { data } = await apiClient.post<FacebookWorkflowStatusResponse>(
      `/livestreams/${id}/facebook/metadata`,
      payload,
      { params: { workspaceId } },
    );
    return data;
  },

  async publishFacebook(
    id: string,
    workspaceId: string,
    payload?: { platformId?: string },
  ): Promise<FacebookWorkflowStatusResponse> {
    const { data } = await apiClient.post<FacebookWorkflowStatusResponse>(
      `/livestreams/${id}/facebook/publish`,
      payload || {},
      { params: { workspaceId }, timeout: 60000 },
    );
    return data;
  },

  async getFacebookStatus(
    id: string,
    workspaceId: string,
    platformId?: string,
  ): Promise<FacebookWorkflowStatusResponse> {
    const { data } = await apiClient.get<FacebookWorkflowStatusResponse>(
      `/livestreams/${id}/facebook/status`,
      { params: { workspaceId, platformId } },
    );
    return data;
  },

  async confirmInstagramLive(
    id: string,
    workspaceId: string,
    payload?: { platformId?: string },
  ): Promise<InstagramWorkflowStatusResponse> {
    const { data } = await apiClient.post<InstagramWorkflowStatusResponse>(
      `/livestreams/${id}/instagram/confirm-live`,
      payload || {},
      { params: { workspaceId }, timeout: 60000 },
    );
    return data;
  },

  async getInstagramStatus(
    id: string,
    workspaceId: string,
    platformId?: string,
  ): Promise<InstagramWorkflowStatusResponse> {
    const { data } = await apiClient.get<InstagramWorkflowStatusResponse>(
      `/livestreams/${id}/instagram/status`,
      { params: { workspaceId, platformId } },
    );
    return data;
  },
};
