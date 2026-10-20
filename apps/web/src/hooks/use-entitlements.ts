'use client';

import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscription.service';
import { useAuthStore } from '@/stores/auth-store';
import type { SubscriptionEntitlements } from '@/types';

export function useSubscriptionEntitlements() {
  const { isAuthenticated, scope, user } = useAuthStore();
  const isPlatformAdmin =
    scope === 'PLATFORM' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ADMIN';

  const {
    data: entitlements,
    isLoading,
    isError,
    refetch,
  } = useQuery<SubscriptionEntitlements>({
    queryKey: ['subscriptions', 'entitlements'],
    queryFn: () => subscriptionService.getEntitlements(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  });

  // If user is a platform admin, they are never locked out of platform features
  const hasActiveSubscription =
    isPlatformAdmin || !!entitlements?.hasActiveSubscription;

  return {
    entitlements,
    hasActiveSubscription,
    isPlatformAdmin,
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
