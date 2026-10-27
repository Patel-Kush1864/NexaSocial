'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useSubscriptionEntitlements } from '@/hooks/use-entitlements';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { SubscriptionOnboardingScreen } from '@/components/onboarding/subscription-onboarding-screen';
import { toast } from 'sonner';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const { hasPermission } = useAuthStore();
  const { currentWorkspace, workspaces } = useWorkspaceStore();
  const {
    hasActiveSubscription,
    isPlatformAdmin,
    isWorkspaceOwner,
    workspaceId,
    isLoading: isEntitlementsLoading,
  } = useSubscriptionEntitlements();

  const isBillingOrPaymentRoute =
    pathname === '/billing' ||
    pathname.startsWith('/billing/') ||
    pathname === '/subscriptions' ||
    pathname.startsWith('/subscriptions/') ||
    pathname === '/payments' ||
    pathname.startsWith('/payments/') ||
    pathname === '/pricing' ||
    pathname.startsWith('/pricing/') ||
    pathname === '/workspaces/create' ||
    pathname.startsWith('/workspaces/create');

  const hasWorkspace = Boolean(
    currentWorkspace || workspaceId || workspaces.length > 0,
  );
  const isPendingOnboarding = !isPlatformAdmin && !hasWorkspace;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Protect subscription-restricted pages for existing workspaces with inactive subscription
    if (
      !isLoading &&
      !isEntitlementsLoading &&
      isAuthenticated &&
      !isPlatformAdmin &&
      !hasActiveSubscription &&
      !isPendingOnboarding
    ) {
      // Existing owner without active subscription must be routed to plan selection
      if (isWorkspaceOwner && pathname === '/dashboard') {
        router.push('/billing');
        return;
      }

      const allowedPaths = isWorkspaceOwner
        ? ['/billing', '/settings', '/notifications']
        : ['/dashboard', '/settings', '/notifications'];

      const isAllowed = allowedPaths.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`),
      );

      if (!isAllowed) {
        toast.info('Feature Locked', {
          description: isWorkspaceOwner
            ? 'Welcome to NexaSocial! Choose a subscription plan to activate your workspace and access the features included in your plan.'
            : 'This workspace does not currently have an active subscription. Please contact the workspace owner.',
        });
        router.push(isWorkspaceOwner ? '/billing' : '/dashboard');
        return;
      }
    }

    // Protect RBAC routes from direct URL entry
    if (!isLoading && isAuthenticated && !isPendingOnboarding) {
      if (
        (pathname.startsWith('/admin') || pathname.startsWith('/social-platforms')) &&
        !isPlatformAdmin &&
        !hasPermission('platform.dashboard.view') &&
        !hasPermission('platform.settings.view')
      ) {
        toast.error("You don't have permission to perform this action. Please contact your workspace administrator.");
        router.push('/dashboard');
        return;
      }

      if (
        (pathname === '/team' || pathname.startsWith('/team/')) &&
        !hasPermission('team.members.view') &&
        !hasPermission('workspace.members.view')
      ) {
        toast.error("You don't have permission to perform this action. Please contact your workspace administrator.");
        router.push('/dashboard');
        return;
      }

      if (
        (pathname === '/billing' || pathname.startsWith('/billing/') || pathname === '/subscriptions' || pathname.startsWith('/subscriptions/')) &&
        !isPlatformAdmin &&
        !hasPermission('billing.view') &&
        !hasPermission('subscription.view')
      ) {
        toast.error("You don't have permission to manage this workspace's billing. Please contact the workspace owner.");
        router.push('/dashboard');
        return;
      }

      if (
        (pathname === '/streams' || pathname.startsWith('/streams/') || pathname === '/live-streams' || pathname.startsWith('/live-streams/')) &&
        !hasPermission('livestreams.view') &&
        !hasPermission('workspace.livestreams.view')
      ) {
        toast.error("You don't have permission to perform this action. Please contact your workspace administrator.");
        router.push('/dashboard');
        return;
      }

      if (
        (pathname === '/content' || pathname.startsWith('/content/')) &&
        !hasPermission('content.view') &&
        !hasPermission('workspace.content.view')
      ) {
        toast.error("You don't have permission to perform this action. Please contact your workspace administrator.");
        router.push('/dashboard');
        return;
      }

      if (
        (pathname === '/media' || pathname.startsWith('/media/')) &&
        !hasPermission('media.view') &&
        !hasPermission('workspace.media.view')
      ) {
        toast.error("You don't have permission to perform this action. Please contact your workspace administrator.");
        router.push('/dashboard');
        return;
      }

      if (
        (pathname === '/social' || pathname.startsWith('/social/') || pathname === '/connected-accounts' || pathname.startsWith('/connected-accounts/')) &&
        !hasPermission('social_accounts.view') &&
        !hasPermission('workspace.social_accounts.view')
      ) {
        toast.error("You don't have permission to perform this action. Please contact your workspace administrator.");
        router.push('/dashboard');
        return;
      }
    }
  }, [
    isLoading,
    isEntitlementsLoading,
    isAuthenticated,
    isPlatformAdmin,
    isWorkspaceOwner,
    hasActiveSubscription,
    pathname,
    router,
    hasPermission,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" label="Loading NexaSocial Command Center..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Drawer */}
      <MobileSidebar />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs />
            {isPendingOnboarding && !isBillingOrPaymentRoute ? (
              <SubscriptionOnboardingScreen />
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
