'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { dashboardService } from '@/services/dashboard.service';
import { queryKeys } from '@/lib/query-client';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/cards/stat-card';
import { OverviewChart } from '@/components/charts/overview-chart';
import { PlatformChart } from '@/components/charts/platform-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DashboardKpiSkeleton } from '@/components/dashboard/skeletons/dashboard-kpi-skeleton';
import { DashboardChartSkeleton } from '@/components/dashboard/skeletons/dashboard-chart-skeleton';
import {
  Users,
  Radio,
  Share2,
  TrendingUp,
  Plus,
  Radio as RadioIcon,
  ArrowRight,
  Activity,
} from 'lucide-react';

import { useSubscriptionEntitlements } from '@/hooks/use-entitlements';
import { LockedDashboardView } from '@/components/dashboard/locked-dashboard-view';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export function WorkspaceDashboard() {
  const { currentWorkspace } = useWorkspaceStore();
  const {
    hasActiveSubscription,
    status,
    isLoading: isEntitlementsLoading,
    refetch: refetchEntitlements,
  } = useSubscriptionEntitlements();

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: queryKeys.dashboard.summary(currentWorkspace?.id || ''),
    queryFn: () => dashboardService.getSummary(currentWorkspace!.id),
    enabled: !!currentWorkspace?.id && hasActiveSubscription,
  });

  const { data: statistics, isLoading: isStatsLoading } = useQuery({
    queryKey: queryKeys.dashboard.statistics(currentWorkspace?.id || ''),
    queryFn: () => dashboardService.getStatistics(currentWorkspace!.id),
    enabled: !!currentWorkspace?.id && hasActiveSubscription,
  });

  if (isEntitlementsLoading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Verifying subscription entitlement..." />
      </div>
    );
  }

  // If user does not have an active subscription, render locked dashboard mode
  if (!hasActiveSubscription) {
    return (
      <LockedDashboardView
        status={status}
        onRefreshEntitlements={refetchEntitlements}
      />
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold">No Workspace Selected</h2>
        <p className="text-sm text-muted-foreground">
          Please select or create a workspace to view your dashboard.
        </p>
      </div>
    );
  }



  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back to ${currentWorkspace?.name || 'Workspace'}`}
        description="Here is your social media growth and broadcast summary for today."
        badge={currentWorkspace?.slug || 'workspace'}
        action={
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="outline"
              className="h-10 text-xs font-semibold glass-panel"
            >
              <Link href="/social">
                <Share2 className="w-3.5 h-3.5 mr-2" />
                Connect Account
              </Link>
            </Button>
            <Button
              asChild
              className="h-10 text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-500/20"
            >
              <Link href="/streams/new">
                <Plus className="w-3.5 h-3.5 mr-2" />
                Create Stream
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {isSummaryLoading ? (
          <>
            <DashboardKpiSkeleton />
            <DashboardKpiSkeleton />
            <DashboardKpiSkeleton />
            <DashboardKpiSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Followers"
              value={(summary?.totalFollowers || 0).toLocaleString()}
              change="+12.4%"
              isPositive={true}
              icon={Users}
              gradient="from-violet-600 to-indigo-600"
            />
            <StatCard
              title="Engagement Rate"
              value={`${summary?.engagementRate || 0}%`}
              change="+0.6%"
              isPositive={true}
              icon={TrendingUp}
              gradient="from-emerald-500 to-teal-600"
            />
            <StatCard
              title="Connected Accounts"
              value={summary?.connectedAccounts || 0}
              change="All Synced"
              isPositive={true}
              icon={Share2}
              gradient="from-pink-500 to-rose-600"
            />
            <StatCard
              title="Active Live Streams"
              value={summary?.activeStreams || 0}
              change="Broadcasting Now"
              isPositive={true}
              icon={Radio}
              gradient="from-amber-500 to-orange-600"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Audience Growth & Engagement</CardTitle>
            <CardDescription className="text-xs">
              Daily follower acquisitions across all connected platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? <DashboardChartSkeleton /> : <OverviewChart data={statistics?.followerGrowth} />}
          </CardContent>
        </Card>

        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Platform Breakdown</CardTitle>
            <CardDescription className="text-xs">
              Follower distribution by channel
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? <DashboardChartSkeleton /> : <PlatformChart data={statistics?.platformBreakdown} />}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-panel border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <RadioIcon className="w-5 h-5 text-rose-500 animate-pulse" />
                Live Stream Control
              </CardTitle>
              <CardDescription className="text-xs">
                Manage your scheduled multi-platform broadcasts
              </CardDescription>
            </div>
            <Button asChild size="sm" variant="ghost" className="text-xs text-primary font-semibold">
              <Link href="/streams">
                View all
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4 text-xs text-muted-foreground">
              No active streams at the moment.
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-400" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-xs">
              Audit log of platform events and automated tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-4 text-xs text-muted-foreground">
                No recent activity to display.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
