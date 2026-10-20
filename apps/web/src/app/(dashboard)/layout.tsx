'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useSubscriptionEntitlements } from '@/hooks/use-entitlements';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { toast } from 'sonner';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const {
    hasActiveSubscription,
    isPlatformAdmin,
    isLoading: isEntitlementsLoading,
  } = useSubscriptionEntitlements();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Protect subscription-restricted pages from direct URL entry
    if (
      !isLoading &&
      !isEntitlementsLoading &&
      isAuthenticated &&
      !isPlatformAdmin &&
      !hasActiveSubscription
    ) {
      const allowedPaths = ['/dashboard', '/billing', '/settings', '/notifications'];
      const isAllowed = allowedPaths.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`),
      );
      if (!isAllowed) {
        toast.info('Feature Locked', {
          description: 'Choose a subscription plan to unlock NexaSocial features.',
        });
        router.push('/dashboard');
      }
    }
  }, [
    isLoading,
    isEntitlementsLoading,
    isAuthenticated,
    isPlatformAdmin,
    hasActiveSubscription,
    pathname,
    router,
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
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
