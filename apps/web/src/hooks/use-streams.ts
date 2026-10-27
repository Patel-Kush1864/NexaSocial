'use client';

// ═══════════════════════════════════════════
// NexaSocial — Live Stream Hooks
// ═══════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { livestreamService } from '@/services/livestream.service';
import { queryKeys } from '@/lib/query-client';
import { toast } from 'sonner';

export function useStreams(workspaceId?: string) {
  const queryClient = useQueryClient();

  const streamsQuery = useQuery({
    queryKey: queryKeys.streams.all(workspaceId || ''),
    queryFn: () => livestreamService.getHistory(workspaceId!),
    enabled: !!workspaceId,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const dashboardStatsQuery = useQuery({
    queryKey: queryKeys.streams.dashboard(workspaceId || ''),
    queryFn: () => livestreamService.getDashboardStats(workspaceId!),
    enabled: !!workspaceId,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const createMutation = useMutation({
    mutationFn: ({
      workspaceId,
      payload,
    }: {
      workspaceId: string;
      payload: {
        title: string;
        description?: string;
        platformAccountIds?: string[];
        connectedAccountIds?: string[];
      };
    }) => livestreamService.create(workspaceId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.streams.all(variables.workspaceId),
      });
      toast.success('Live stream created successfully');
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const responseMsg = error?.response?.data?.message;
      const errorText = Array.isArray(responseMsg)
        ? responseMsg.join(', ')
        : responseMsg || 'Failed to create stream';
      toast.error(errorText);
    },
  });

  const startMutation = useMutation({
    mutationFn: ({ id, workspaceId }: { id: string; workspaceId: string }) =>
      livestreamService.start(id, workspaceId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.streams.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.streams.all(variables.workspaceId),
      });
      toast.success('Stream started! Broadcasting to connected channels.');
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const responseMsg = error?.response?.data?.message;
      const errorText = Array.isArray(responseMsg)
        ? responseMsg.join(', ')
        : responseMsg || 'Failed to start stream';
      toast.error(errorText);
    },
  });

  const stopMutation = useMutation({
    mutationFn: ({ id, workspaceId }: { id: string; workspaceId: string }) =>
      livestreamService.stop(id, workspaceId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.streams.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.streams.all(variables.workspaceId),
      });
      toast.success('Stream ended');
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const responseMsg = error?.response?.data?.message;
      const errorText = Array.isArray(responseMsg)
        ? responseMsg.join(', ')
        : responseMsg || 'Failed to stop stream';
      toast.error(errorText);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, workspaceId }: { id: string; workspaceId: string }) =>
      livestreamService.delete(id, workspaceId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.streams.all(variables.workspaceId),
      });
      toast.success('Stream deleted');
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const responseMsg = error?.response?.data?.message;
      const errorText = Array.isArray(responseMsg)
        ? responseMsg.join(', ')
        : responseMsg || 'Failed to delete stream';
      toast.error(errorText);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      workspaceId,
      payload,
    }: {
      id: string;
      workspaceId: string;
      payload: { title?: string; description?: string; youtubeStreamKey?: string; customStreamKey?: string };
    }) => livestreamService.update(id, workspaceId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.streams.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.streams.all(variables.workspaceId),
      });
      toast.success('Live stream details updated');
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const responseMsg = error?.response?.data?.message;
      const errorText = Array.isArray(responseMsg)
        ? responseMsg.join(', ')
        : responseMsg || 'Failed to update stream';
      toast.error(errorText);
    },
  });

  return {
    streams: streamsQuery.data || [],
    dashboardStats: dashboardStatsQuery.data,
    isLoading: streamsQuery.isLoading,
    isRefetching: streamsQuery.isRefetching || dashboardStatsQuery.isRefetching,
    isError: streamsQuery.isError || dashboardStatsQuery.isError,
    refetch: async () => {
      await Promise.all([streamsQuery.refetch(), dashboardStatsQuery.refetch()]);
    },
    createStream: createMutation.mutateAsync,
    updateStream: updateMutation.mutateAsync,
    startStream: startMutation.mutateAsync,
    stopStream: stopMutation.mutateAsync,
    deleteStream: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useStreamDetails(id?: string, workspaceId?: string) {
  return useQuery({
    queryKey: queryKeys.streams.detail(id || ''),
    queryFn: () => livestreamService.getDetails(id!, workspaceId!),
    enabled: !!id && !!workspaceId,
    refetchInterval: (query) => {
      const data = query.state.data;
      const status = data?.status;
      const hasPendingPlatforms = data?.platforms?.some(
        (p: any) =>
          p.status === 'PENDING' ||
          p.status === 'CONFIGURED' ||
          p.status === 'STARTING' ||
          p.status === 'TRANSMITTING' ||
          p.status === 'WAITING_FOR_PLATFORM_PREVIEW' ||
          p.status === 'WAITING_FOR_INSTAGRAM_CONFIRMATION' ||
          p.status === 'CONNECTING',
      );
      if (
        status === 'LIVE' ||
        status === 'IDLE' ||
        status === 'SCHEDULED' ||
        hasPendingPlatforms
      ) {
        return 3000;
      }
      return false;
    },
  });
}
