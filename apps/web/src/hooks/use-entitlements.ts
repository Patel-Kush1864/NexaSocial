'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscription.service';
import { workspaceService } from '@/services/workspace.service';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import type { SubscriptionEntitlements } from '@/types';

export function useSubscriptionEntitlements() {
  const { isAuthenticated, scope, user } = useAuthStore();
  const { currentWorkspace, setWorkspaces } = useWorkspaceStore();
  const isPlatformAdmin =
    scope === 'PLATFORM' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ADMIN';

  const workspaceId = currentWorkspace?.id;

  const {
    data: entitlements,
    isLoading,
    isError,
    refetch,
  } = useQuery<SubscriptionEntitlements>({
    queryKey: ['subscriptions', 'entitlements', workspaceId],
    queryFn: () => subscriptionService.getEntitlements(workspaceId),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  });

  // If entitlements has a workspaceId but currentWorkspace is not loaded, rehydrate
  useEffect(() => {
    if (entitlements?.workspaceId && !currentWorkspace) {
      workspaceService
        .getAll()
        .then((wsList) => {
          if (wsList && wsList.length > 0) {
            setWorkspaces(wsList);
          }
        })
        .catch(() => {});
    }
  }, [entitlements?.workspaceId, currentWorkspace, setWorkspaces]);

  // If user is a platform admin, they are never locked out of platform features
  const hasActiveSubscription =
    isPlatformAdmin || !!entitlements?.hasActiveSubscription;

  const isWorkspaceOwner =
    entitlements?.isWorkspaceOwner ??
    (currentWorkspace?.ownerId
      ? currentWorkspace.ownerId === user?.id
      : currentWorkspace?.role === 'OWNER' || user?.role === 'WORKSPACE_OWNER');

  const workspaceRole =
    entitlements?.workspaceRole ||
    currentWorkspace?.role ||
    (isWorkspaceOwner ? 'OWNER' : 'VIEWER');

  return {
    entitlements,
    hasActiveSubscription,
    isPlatformAdmin,
    isWorkspaceOwner,
    workspaceRole,
    workspaceId: entitlements?.workspaceId || workspaceId || null,
    workspaceName: entitlements?.workspaceName || currentWorkspace?.name || null,
    status: entitlements?.status || 'NONE',
    planName: entitlements?.planName || null,
    planPrice: entitlements?.planPrice ?? 0,
    features: entitlements?.features || null,
    latestPayment: entitlements?.latestPayment || null,
    isLoading,
    isError,
    refetch,
  };
}
