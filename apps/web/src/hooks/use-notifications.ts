'use client';

// ═══════════════════════════════════════════
// NexaSocial — Notifications Hook
// ═══════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '@/stores/notification-store';
import { notificationService } from '@/services/notification.service';
import { queryKeys } from '@/lib/query-client';
import { toast } from 'sonner';

export function useNotifications(workspaceId?: string) {
  const queryClient = useQueryClient();
  const {
    notifications,
    unreadCount,
    setNotifications,
    setUnreadCount,
    markAsRead: markReadStore,
    markAllAsRead: markAllReadStore,
    removeNotification: removeStore,
  } = useNotificationStore();

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications.all(workspaceId),
    queryFn: async () => {
      const data = await notificationService.getAll({ workspaceId });
      const safeData = Array.isArray(data) ? data : [];
      setNotifications(safeData);
      return safeData;
    },
  });

  const unreadCountQuery = useQuery({
    queryKey: queryKeys.notifications.unreadCount(workspaceId),
    queryFn: async () => {
      const res = await notificationService.getUnreadCount(workspaceId);
      const count = typeof res?.unreadCount === 'number' ? res.unreadCount : 0;
      setUnreadCount(count);
      return count;
    },
    refetchInterval: 30000, // Fallback poll every 30s
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: (_, id) => {
      markReadStore(id);
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all(workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(workspaceId),
      });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(workspaceId),
    onSuccess: () => {
      markAllReadStore();
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all(workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(workspaceId),
      });
      toast.success('All notifications marked as read');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationService.delete(id),
    onSuccess: (_, id) => {
      removeStore(id);
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all(workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(workspaceId),
      });
      toast.success('Notification removed');
    },
  });

  const rawList = notificationsQuery.data ?? notifications;
  const safeList = Array.isArray(rawList)
    ? rawList
    : Array.isArray((rawList as any)?.data)
    ? (rawList as any).data
    : [];

  return {
    notifications: safeList,
    unreadCount: unreadCountQuery.data ?? unreadCount,
    isLoading: notificationsQuery.isLoading,
    markAsRead: markReadMutation.mutateAsync,
    markAllAsRead: markAllReadMutation.mutateAsync,
    deleteNotification: deleteMutation.mutateAsync,
  };
}
