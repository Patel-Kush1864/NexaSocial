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
  });

  const dashboardStatsQuery = useQuery({
    queryKey: queryKeys.streams.dashboard(workspaceId || ''),
    queryFn: () => livestreamService.getDashboardStats(workspaceId!),
    enabled: !!workspaceId,
  });

  const createMutation = useMutation({
    mutationFn: ({
      workspaceId,
      payload,
    }: {
      workspaceId: string;
      payload: { title: string; description?: string; platformAccountIds?: string[] };
    }) => livestreamService.create(workspaceId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.streams.all(variables.workspaceId),
      });
      toast.success('Live stream created successfully');
    },
    onError: () => {
      toast.error('Failed to create stream');
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
    onError: () => {
      toast.error('Failed to start stream');
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
    onError: () => {
      toast.error('Failed to stop stream');
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
    onError: () => {
      toast.error('Failed to delete stream');
    },
  });

  return {
    streams: streamsQuery.data || [],
    dashboardStats: dashboardStatsQuery.data,
    isLoading: streamsQuery.isLoading,
    createStream: createMutation.mutateAsync,
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
    refetchInterval: (query) => (query.state.data?.status === 'LIVE' ? 5000 : false),
  });
}
