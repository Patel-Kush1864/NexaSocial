// ═══════════════════════════════════════════
// NexaSocial — Social API Service
// ═══════════════════════════════════════════

import apiClient from '@/lib/api-client';
import type { SocialAccount, SocialPlatformInfo, SuccessResponse } from '@/types';

export const socialService = {
  async getPlatforms(): Promise<SocialPlatformInfo[]> {
    const { data } = await apiClient.get<SocialPlatformInfo[]>(
      '/social/platforms',
    );
    return data;
  },

  async connect(
    platform: string,
    workspaceId: string,
  ): Promise<{ authUrl: string }> {
    const { data } = await apiClient.post<{ authUrl: string }>(
      `/social/connect/${platform}`,
      null,
      { params: { workspaceId } },
    );
    return data;
  },

  async getAccounts(workspaceId: string): Promise<SocialAccount[]> {
    const { data } = await apiClient.get<SocialAccount[]>(
      '/social/accounts',
      { params: { workspaceId } },
    );
    return data;
  },

  async getAccountDetails(
    accountId: string,
    workspaceId: string,
  ): Promise<SocialAccount> {
    const { data } = await apiClient.get<SocialAccount>(
      `/social/accounts/${accountId}`,
      { params: { workspaceId } },
    );
    return data;
  },

  async forceRefresh(
    accountId: string,
    workspaceId: string,
  ): Promise<SuccessResponse> {
    const { data } = await apiClient.post<SuccessResponse>(
      `/social/accounts/${accountId}/refresh`,
      null,
      { params: { workspaceId } },
    );
    return data;
  },

  async disconnect(
    accountId: string,
    workspaceId: string,
  ): Promise<SuccessResponse> {
    const { data } = await apiClient.delete<SuccessResponse>(
      `/social/accounts/${accountId}`,
      { params: { workspaceId } },
    );
    return data;
  },

  async syncAccount(
    accountId: string,
    workspaceId: string,
  ) {
    const { data } = await apiClient.post(
      `/social/accounts/${accountId}/sync`,
      null,
      { params: { workspaceId } },
    );
    return data;
  },
};
