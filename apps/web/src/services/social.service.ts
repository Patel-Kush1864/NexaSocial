// ═══════════════════════════════════════════
// NexaSocial — Social API Service
// ═══════════════════════════════════════════

import apiClient from '@/lib/api-client';
import type {
  SocialAccount,
  SocialPlatform,
  SocialPlatformInfo,
  SuccessResponse,
  FacebookAccountResponse,
} from '@/types';

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
    if (platform.toUpperCase() === 'FACEBOOK') {
      const { data } = await apiClient.get<{ url?: string; authUrl?: string }>(
        '/social/facebook/connect',
      );
      return { authUrl: data?.authUrl || data?.url || '' };
    }
    if (platform.toUpperCase() === 'YOUTUBE') {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      return {
        authUrl: `${backendUrl}/auth/google?workspaceId=${encodeURIComponent(workspaceId)}`,
      };
    }
    const { data } = await apiClient.post<{ url?: string; authUrl?: string }>(
      `/social/connect/${platform}`,
      {},
      { params: { workspaceId } },
    );
    return { authUrl: data?.authUrl || data?.url || '' };
  },

  async getAccounts(workspaceId?: string): Promise<SocialAccount[]> {
    try {
      const [generalRes, facebookRes] = await Promise.all([
        apiClient.get<SocialAccount[]>('/social/accounts', {
          params: { workspaceId },
        }).catch(() => ({ data: [] })),
        apiClient
          .get<FacebookAccountResponse[]>('/social/facebook/accounts')
          .catch(() => ({ data: [] })),
      ]);

      const facebookAccounts: SocialAccount[] = (facebookRes.data || []).map(
        (fbAcc: FacebookAccountResponse) => ({
          id: fbAcc.id,
          platform: 'FACEBOOK',
          platformAccountId: fbAcc.pageId || fbAcc.providerUserId,
          accountName: fbAcc.pageName || fbAcc.providerUserName,
          accountAvatar:
            'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=150',
          isActive: fbAcc.status === 'CONNECTED',
          workspaceId: workspaceId || '',
          connectedBy: fbAcc.userId,
          createdAt: fbAcc.createdAt,
          updatedAt: fbAcc.updatedAt,
        }),
      );

      /* eslint-disable @typescript-eslint/no-explicit-any */
      const generalAccounts: SocialAccount[] = (generalRes.data || []).map(
        (acc: any) => ({
          id: acc.id,
          platform: (
            acc.platformName ||
            acc.platform ||
            acc.provider ||
            'YOUTUBE'
          ).toUpperCase() as SocialPlatform,
          platformAccountId: acc.platformUserId || acc.providerUserId || acc.id,
          accountName:
            acc.name ||
            acc.accountName ||
            acc.providerUserName ||
            acc.providerName ||
            'Connected Channel',
          accountAvatar:
            acc.avatar ||
            acc.accountAvatar ||
            'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=150',
          isActive:
            acc.status === 'CONNECTED' ||
            acc.isActive === true ||
            acc.connected === true,
          workspaceId: acc.workspaceId || workspaceId || '',
          connectedBy: acc.userId || '',
          createdAt: acc.createdAt || acc.created_at,
          updatedAt: acc.updatedAt || acc.updated_at,
        }),
      );
      /* eslint-enable @typescript-eslint/no-explicit-any */

      const existingIds = new Set(facebookAccounts.map((a) => a.id));
      const combined = [
        ...facebookAccounts,
        ...generalAccounts.filter((a) => !existingIds.has(a.id)),
      ];

      return combined;
    } catch {
      return [];
    }
  },

  async getFacebookAccounts(): Promise<FacebookAccountResponse[]> {
    const { data } = await apiClient.get<FacebookAccountResponse[]>(
      '/social/facebook/accounts',
    );
    return data;
  },

  async disconnectFacebookAccount(id: string): Promise<void> {
    await apiClient.delete(`/social/facebook/${id}`);
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
    workspaceId?: string,
  ): Promise<SuccessResponse> {
    try {
      const { data } = await apiClient.delete<SuccessResponse>(
        `/social/accounts/${accountId}`,
        { params: { workspaceId } },
      );
      return data;
    } catch {
      await apiClient.delete(`/social/facebook/${accountId}`);
      return { success: true };
    }
  },

  async syncAccount(accountId: string, workspaceId: string) {
    const { data } = await apiClient.post(
      `/social/accounts/${accountId}/sync`,
      null,
      { params: { workspaceId } },
    );
    return data;
  },
};
