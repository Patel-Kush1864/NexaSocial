'use client';

// ═══════════════════════════════════════════
// NexaSocial — Social Hooks
// ═══════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialService } from '@/services/social.service';
import { queryKeys } from '@/lib/query-client';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import type { ApiError } from '@/types';

export function useSocialAccounts(workspaceId?: string) {
  const queryClient = useQueryClient();

  const accountsQuery = useQuery({
    queryKey: queryKeys.social.accounts(workspaceId || ''),
    queryFn: () => socialService.getAccounts(workspaceId!),
    enabled: !!workspaceId,
  });

  const platformsQuery = useQuery({
    queryKey: queryKeys.social.platforms,
    queryFn: () => socialService.getPlatforms(),
  });

  const connectMutation = useMutation({
    mutationFn: ({ platform, workspaceId }: { platform: string; workspaceId: string }) =>
      socialService.connect(platform, workspaceId),
    onSuccess: (res) => {
      const url = res.authUrl || (res as { url?: string })?.url;
      if (url) {
        window.location.href = url;
      }
    },
    onError: () => {
      toast.error('Failed to initiate OAuth connection');
    },
  });

  const syncMutation = useMutation({
    mutationFn: ({ accountId, workspaceId }: { accountId: string; workspaceId: string }) =>
      socialService.syncAccount(accountId, workspaceId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.social.accounts(variables.workspaceId),
      });
      toast.success('Account synced successfully');
    },
    onError: (err: AxiosError<ApiError>) => {
      const serverMsg = err?.response?.data?.message;
      const displayMsg = Array.isArray(serverMsg) ? serverMsg.join(', ') : serverMsg;
      toast.error(displayMsg || 'Failed to sync social account');
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: ({ accountId, workspaceId }: { accountId: string; workspaceId: string }) =>
      socialService.disconnect(accountId, workspaceId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.social.accounts(variables.workspaceId),
      });
      toast.success('Account disconnected');
    },
    onError: () => {
      toast.error('Failed to disconnect account');
    },
  });

  return {
    accounts: accountsQuery.data || [],
    platforms: platformsQuery.data || [],
    isLoading: accountsQuery.isLoading,
    connect: connectMutation.mutateAsync,
    sync: syncMutation.mutateAsync,
    disconnect: disconnectMutation.mutateAsync,
    isConnecting: connectMutation.isPending,
  };
}
