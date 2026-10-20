'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { PageHeader } from '@/components/shared/page-header';
import { DashboardKpiCard } from '@/components/dashboard/dashboard-kpi-card';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { UserAnalytics } from '@/components/analytics/user-analytics';
import { SocialPlatformAnalytics } from '@/components/analytics/social-platform-analytics';
import { LiveStreamAnalytics } from '@/components/analytics/live-stream-analytics';
import { RecentActivity } from '@/components/admin/recent-activity';
import { SystemHealth } from '@/components/admin/system-health';
import {
  Users,
  Building2,
  CreditCard,
  TrendingUp,
  Link2,
  Video,
  Activity,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { PlatformDashboardSummary } from '@/types';
import { Button } from '@/components/ui/button';
import { LazySection } from '@/components/shared/lazy-section';

export function PlatformDashboard() {
  const { user } = useAuthStore();
  const { data: kpis, isLoading, isError, refetch } = useQuery<PlatformDashboardSummary>({
    queryKey: ['platform-summary'],
    queryFn: () => dashboardService.getSummary() as unknown as Promise<PlatformDashboardSummary>,
  });

  const hour = new Date().getHours();
  let greeting = 'Good Evening';
  if (hour >= 5 && hour < 12) greeting = 'Good Morning';
  else if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';

  if (isError) {
    return (
      <div className="space-y-8">
        <PageHeader
          title={`${greeting}, ${user?.firstName || 'Admin'}`}
          description="Here's your NexaSocial platform overview."
        />
        <div className="p-4 border border-red-200 bg-red-50 text-red-900 rounded-lg dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4" />
            <h5 className="font-medium">Error</h5>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm">Unable to load dashboard statistics.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Try again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="platform.dashboard.view">
      <div className="space-y-8">
        <PageHeader
          title={`${greeting}, ${user?.firstName || 'Admin'}`}
          description="Here's your NexaSocial platform overview."
        />

        {/* Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <DashboardKpiCard
            title="Total Users"
            value={formatNumber(kpis?.totalUsers?.value || 0)}
            change={kpis?.totalUsers?.change || 0}
            direction={kpis?.totalUsers?.direction || 'neutral'}
            icon={Users}
            gradient="from-blue-600 to-cyan-600"
            isLoading={isLoading}
          />
          <DashboardKpiCard
            title="Workspaces"
            value={formatNumber(kpis?.workspaces?.value || 0)}
            change={kpis?.workspaces?.change || 0}
            direction={kpis?.workspaces?.direction || 'neutral'}
            icon={Building2}
            gradient="from-violet-600 to-indigo-600"
            isLoading={isLoading}
          />
          <DashboardKpiCard
            title="Subscriptions"
            value={formatNumber(kpis?.subscriptions?.value || 0)}
            change={kpis?.subscriptions?.change || 0}
            direction={kpis?.subscriptions?.direction || 'neutral'}
            icon={CreditCard}
            gradient="from-emerald-500 to-teal-600"
            isLoading={isLoading}
          />
          <DashboardKpiCard
            title="Revenue"
            value={formatCurrency(Number(kpis?.revenue?.value || 0), kpis?.revenue?.currency || 'INR')}
            change={kpis?.revenue?.change || 0}
            direction={kpis?.revenue?.direction || 'neutral'}
            icon={TrendingUp}
            gradient="from-green-500 to-emerald-600"
            isLoading={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <DashboardKpiCard
            title="Connected Accounts"
            value={formatNumber(kpis?.connectedAccounts?.value || 0)}
            change={kpis?.connectedAccounts?.change || 0}
            direction={kpis?.connectedAccounts?.direction || 'neutral'}
            icon={Link2}
            gradient="from-indigo-500 to-purple-600"
            isLoading={isLoading}
          />
          <DashboardKpiCard
            title="Live Streams"
            value={formatNumber(kpis?.liveStreams?.value || 0)}
            change={kpis?.liveStreams?.change || 0}
            direction={kpis?.liveStreams?.direction || 'neutral'}
            icon={Video}
            gradient="from-amber-500 to-orange-600"
            isLoading={isLoading}
          />
          <DashboardKpiCard
            title="Active Users"
            value={formatNumber(kpis?.activeUsers?.value || 0)}
            change={kpis?.activeUsers?.change || 0}
            direction={kpis?.activeUsers?.direction || 'neutral'}
            icon={Activity}
            gradient="from-pink-500 to-rose-600"
            isLoading={isLoading}
          />
          <DashboardKpiCard
            title="Failed Payments"
            value={formatNumber(kpis?.failedPayments?.value || 0)}
            change={kpis?.failedPayments?.change || 0}
            direction={kpis?.failedPayments?.direction || 'neutral'}
            sentiment="negative"
            icon={AlertCircle}
            gradient="from-rose-500 to-red-600"
            isLoading={isLoading}
          />
        </div>

        {/* Phase 55: Primary Analytics Row */}
        <div className="flex flex-col gap-8 pt-8 mt-8 border-t dark:border-gray-800">
          <LazySection minHeight={500}>
            <UserAnalytics />
          </LazySection>
        </div>

        {/* Phase 55: Operational Analytics Row */}
        <div className="flex flex-col gap-8 pt-8 mt-8 border-t dark:border-gray-800">
          <LazySection minHeight={500}>
            <LiveStreamAnalytics />
          </LazySection>
          <LazySection minHeight={500}>
            <SocialPlatformAnalytics />
          </LazySection>
        </div>

        {/* Phase 55: Recent Activity */}
        <div className="pt-8 mt-8 border-t dark:border-gray-800">
          <LazySection minHeight={400}>
            <RecentActivity />
          </LazySection>
        </div>

        {/* Phase 55: System Health */}
        <div className="pt-8 mt-8 border-t dark:border-gray-800">
          <LazySection minHeight={300}>
            <SystemHealth />
          </LazySection>
        </div>
      </div>
    </PermissionGuard>
  );
}
