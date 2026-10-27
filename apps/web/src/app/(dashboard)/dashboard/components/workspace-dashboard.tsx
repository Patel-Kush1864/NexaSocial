'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAuthStore } from '@/stores/auth-store';
import { useSocialAccounts } from '@/hooks/use-social';
import { dashboardService } from '@/services/dashboard.service';
import { queryKeys } from '@/lib/query-client';
import { DashboardKpiCard } from '@/components/dashboard/dashboard-kpi-card';
import { OverviewChart } from '@/components/charts/overview-chart';
import { PlatformChart } from '@/components/charts/platform-chart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DashboardChartSkeleton } from '@/components/dashboard/skeletons/dashboard-chart-skeleton';
import { DashboardActivitySkeleton } from '@/components/dashboard/skeletons/dashboard-activity-skeleton';
import {
  Users,
  Radio,
  Share2,
  TrendingUp,
  Plus,
  ArrowRight,
  Activity,
  CreditCard,
  ExternalLink,
  Calendar,
  AlertCircle,
  RefreshCw,
  Building2,
  CheckCircle2,
  ArrowUpRight,
  Layers,
  Sparkles,
  SlidersHorizontal,
  Clock,
  Video,
} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { useSubscriptionEntitlements } from '@/hooks/use-entitlements';
import { LockedDashboardView } from '@/components/dashboard/locked-dashboard-view';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { CreateWorkspaceDialog } from '@/components/dialogs/create-workspace-dialog';
import { SubscriptionOnboardingScreen } from '@/components/onboarding/subscription-onboarding-screen';
import { PLATFORM_CONFIG } from '@/lib/constants';
import type { SocialPlatform } from '@/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

function formatRelativeTime(dateInput?: string | Date | null): string {
  if (!dateInput) return 'Recently';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Recently';
    return dayjs(date).fromNow();
  } catch {
    return 'Recently';
  }
}

const PRIMARY_PLATFORMS: SocialPlatform[] = ['YOUTUBE', 'FACEBOOK', 'INSTAGRAM', 'X'];

export function WorkspaceDashboard() {
  const { currentWorkspace, setCurrentWorkspace, addWorkspace } = useWorkspaceStore();
  const { hasPermission, user } = useAuthStore();
  const [range, setRange] = useState<'7d' | '30d' | '3m'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'studio' | 'audience'>('overview');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    hasActiveSubscription,
    status,
    isWorkspaceOwner,
    workspaceRole,
    isLoading: isEntitlementsLoading,
    refetch: refetchEntitlements,
  } = useSubscriptionEntitlements();

  // Fetch workspace dashboard overview
  const {
    data: overview,
    isLoading: isOverviewLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: queryKeys.dashboard.overview(currentWorkspace?.id || '', range),
    queryFn: () => dashboardService.getOverview(currentWorkspace!.id, range),
    enabled: !!currentWorkspace?.id && hasActiveSubscription,
    refetchInterval: 30000,
  });

  // Fetch connected social accounts for this workspace
  const { accounts, isLoading: isAccountsLoading } = useSocialAccounts(currentWorkspace?.id);

  if (isEntitlementsLoading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Verifying workspace entitlement..." />
      </div>
    );
  }

  // If user has no active subscription and no workspace, render onboarding screen
  if (!hasActiveSubscription && !currentWorkspace) {
    return <SubscriptionOnboardingScreen />;
  }

  // If user does not have an active subscription, render locked dashboard mode
  if (!hasActiveSubscription) {
    return (
      <LockedDashboardView
        status={status}
        onRefreshEntitlements={refetchEntitlements}
        isWorkspaceOwner={isWorkspaceOwner}
        workspaceName={currentWorkspace?.name}
      />
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-glow">
          <Building2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">
            {isWorkspaceOwner ? 'Create Your Workspace' : 'No Active Workspace Selected'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isWorkspaceOwner
              ? 'You are ready to get started! Create your workspace to organize your team, connect social channels, and start live streaming.'
              : 'You do not currently have an active workspace selected. Please select an authorized workspace from the workspace switcher in the sidebar.'}
          </p>
        </div>
        {isWorkspaceOwner && (
          <Button onClick={() => setIsCreateOpen(true)} className="gradient-primary text-white shadow-glow">
            <Plus className="w-4 h-4 mr-2" />
            Create Workspace
          </Button>
        )}
        {isWorkspaceOwner && (
          <CreateWorkspaceDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            onSuccess={(ws) => {
              addWorkspace(ws);
              setCurrentWorkspace(ws);
              refetchEntitlements();
            }}
          />
        )}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 glass-panel border-border/50 rounded-2xl p-8 max-w-md mx-auto">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <h3 className="text-base font-bold">Unable to Load Dashboard Data</h3>
        <p className="text-xs text-muted-foreground">
          There was an error communicating with the NexaSocial API. Please try refreshing.
        </p>
        <Button
          onClick={() => refetch()}
          size="sm"
          className="bg-violet-600 hover:bg-violet-700 text-xs font-semibold gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  const kpis = overview?.kpis;
  const activeStreams = overview?.liveStreams?.active || [];
  const scheduledStreams = overview?.liveStreams?.scheduled || [];
  const allDisplayStreams = [...activeStreams, ...scheduledStreams];
  const recentActivity = overview?.recentActivity || [];

  const canConnectAccount = hasPermission('social_accounts.connect');
  const canCreateStream = hasPermission('livestreams.create');

  // Greeting based on current local hour
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour >= 5 && hour < 12) greeting = 'Good morning';
  else if (hour >= 12 && hour < 17) greeting = 'Good afternoon';

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  // Numeric change parser for Total Followers
  let followerChangeNum: number | undefined = undefined;
  if (kpis?.totalFollowers?.change) {
    const parsed = parseFloat(kpis.totalFollowers.change.replace(/[^0-9.-]/g, ''));
    if (!isNaN(parsed)) followerChangeNum = Math.abs(parsed);
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-1 sm:px-4 pb-12">
      {/* ── Top Header & Workspace Command Bar ────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {greeting}, <span className="gradient-text">{user?.firstName || 'Creator'}</span>
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs px-2.5 py-0.5 font-medium">
              {currentWorkspace?.name}
            </Badge>
            {workspaceRole && (
              <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5">
                {workspaceRole}
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-2">
            <span>{todayFormatted}</span>
            <span className="hidden sm:inline text-muted-foreground/40">•</span>
            <span>Plan: <span className="text-foreground font-medium">{overview?.subscription || 'Pro Active'}</span></span>
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 sm:h-9 px-3 gap-1.5 text-xs font-medium border-border/60 hover:bg-accent"
            title="Refresh workspace overview"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin text-primary')} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {canConnectAccount && (
            <Button asChild variant="outline" size="sm" className="h-8 sm:h-9 px-3 text-xs font-medium">
              <Link href="/social">
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                Connect Channels
              </Link>
            </Button>
          )}

          {canCreateStream && (
            <Button
              asChild
              size="sm"
              className="h-8 sm:h-9 px-3.5 text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-500/20 text-white hover:opacity-95"
            >
              <Link href="/streams/new">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Create Stream
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* ── Active Broadcast Alert Banner (High-Priority Spotlight) ────── */}
      {activeStreams.length > 0 ? (
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-red-950/20 to-background border border-rose-500/40 shadow-sm animate-in fade-in-50 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    LIVE BROADCAST NOW
                  </span>
                  <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                    Started {formatRelativeTime(activeStreams[0].startedAt)}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-foreground truncate max-w-md">
                  {activeStreams[0].title}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  Destinations: {activeStreams[0].platforms?.length > 0 ? activeStreams[0].platforms.join(', ') : 'Multi-platform live stream'}
                </p>
              </div>
            </div>

            <Button
              asChild
              size="sm"
              className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold shadow-md shadow-rose-500/25 shrink-0 h-9 px-4"
            >
              <Link href={`/streams/${activeStreams[0].id}`}>
                Enter Live Studio
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      ) : scheduledStreams.length > 0 ? (
        <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                Upcoming Broadcast: <span className="font-normal">{scheduledStreams[0].title}</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                Scheduled {formatRelativeTime(scheduledStreams[0].scheduledAt)} • {scheduledStreams[0].platforms?.length > 0 ? scheduledStreams[0].platforms.join(', ') : 'Multi-stream'}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="h-8 text-xs shrink-0 self-start sm:self-auto">
            <Link href={`/streams/${scheduledStreams[0].id}`}>
              Stream Setup
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </div>
      ) : null}

      {/* ── Core Creator KPIs (The 4 Essential Workspace Metrics) ─────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <DashboardKpiCard
          title="Total Followers"
          value={
            kpis?.totalFollowers?.hasData
              ? formatNumber(kpis.totalFollowers.value)
              : '0'
          }
          change={followerChangeNum}
          direction={kpis?.totalFollowers?.isPositive ? 'up' : followerChangeNum !== undefined ? 'down' : 'neutral'}
          subtitle="Audience across connected channels"
          icon={Users}
          gradient="from-violet-600 to-indigo-600"
          href="/social"
          isLoading={isOverviewLoading}
        />
        <DashboardKpiCard
          title="Connected Channels"
          value={kpis?.connectedAccounts?.value ?? accounts.length ?? 0}
          subtitle={`${kpis?.connectedAccounts?.value ?? accounts.length ?? 0} active platforms linked`}
          icon={Share2}
          gradient="from-pink-500 to-rose-600"
          href="/social"
          isLoading={isOverviewLoading}
        />
        <DashboardKpiCard
          title="Multi-Stream Broadcasts"
          value={
            activeStreams.length > 0
              ? `${activeStreams.length} Live Now`
              : scheduledStreams.length > 0
                ? `${scheduledStreams.length} Scheduled`
                : '0 Active'
          }
          subtitle={activeStreams.length > 0 ? 'Broadcasting live to destinations' : 'Ready to stream'}
          icon={Radio}
          gradient="from-amber-500 to-orange-600"
          href="/streams"
          isLoading={isOverviewLoading}
        />
        <DashboardKpiCard
          title="Avg Engagement Rate"
          value={
            kpis?.engagementRate?.hasData && kpis.engagementRate.value !== null
              ? `${kpis.engagementRate.value}%`
              : '—'
          }
          subtitle="Interactions per broadcast & post"
          icon={TrendingUp}
          gradient="from-emerald-500 to-teal-600"
          href="/social"
          isLoading={isOverviewLoading}
        />
      </div>

      {/* ── View Switcher Tabs (Unclutters the workspace dashboard) ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 border border-border/40 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150',
              activeTab === 'overview'
                ? 'bg-background text-foreground shadow-xs border border-border/40'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Workspace Overview
          </button>
          <button
            onClick={() => setActiveTab('studio')}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150',
              activeTab === 'studio'
                ? 'bg-background text-foreground shadow-xs border border-border/40'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Broadcast Studio ({allDisplayStreams.length})
          </button>
          <button
            onClick={() => setActiveTab('audience')}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150',
              activeTab === 'audience'
                ? 'bg-background text-foreground shadow-xs border border-border/40'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Channel Distribution
          </button>
        </div>

        <div className="text-xs text-muted-foreground/80 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Synced with linked channels</span>
        </div>
      </div>

      {/* ── TAB 1: Workspace Overview (Clean, focused, only required data) */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Columns: Growth Chart & Activity */}
          <div className="lg:col-span-8 space-y-6">
            {/* Audience Growth & Reach Chart */}
            <Card className="glass-panel border-border/50 shadow-xs overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/30">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <CardTitle className="text-base sm:text-lg font-bold">Audience Growth & Reach</CardTitle>
                  </div>
                  <CardDescription className="text-xs mt-0.5">
                    Follower acquisitions recorded across all connected networks
                  </CardDescription>
                </div>

                {/* Range Selector */}
                <div className="flex items-center gap-1 bg-background/50 border border-border/50 rounded-lg p-0.5 self-start sm:self-auto">
                  {(['7d', '30d', '3m'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className={cn(
                        'px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                        range === r
                          ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                {isOverviewLoading ? (
                  <DashboardChartSkeleton />
                ) : (
                  <div className="h-[280px] w-full min-w-0">
                    <OverviewChart data={overview?.analytics?.followerGrowth} />
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-border/20 text-xs">
                  <span className="text-muted-foreground">
                    {accounts.length} social account{accounts.length === 1 ? '' : 's'} linked
                  </span>
                  <Link
                    href="/social"
                    className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <span>Manage connected platforms</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Workspace Activity (Concise 5 Items) */}
            <Card className="glass-panel border-border/50 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/30">
                <div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-violet-500" />
                    <CardTitle className="text-base sm:text-lg font-bold">Recent Workspace Events</CardTitle>
                  </div>
                  <CardDescription className="text-xs mt-0.5">
                    Broadcasts, member updates, and channel syncs
                  </CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm" className="h-8 text-xs gap-1">
                  <Link href="/streams">
                    View Streams
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </CardHeader>

              <CardContent className="p-0">
                {isOverviewLoading ? (
                  <div className="p-4">
                    <DashboardActivitySkeleton rows={4} />
                  </div>
                ) : !recentActivity || recentActivity.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No recent activities in this workspace yet.
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {recentActivity.slice(0, 5).map((act) => {
                      let iconNode = <Activity className="w-4 h-4 text-violet-400" />;
                      let bgClass = 'bg-violet-500/10 text-violet-400';

                      const upper = `${act.action}_${act.module}`.toUpperCase();
                      if (upper.includes('STREAM')) {
                        iconNode = <Radio className="w-4 h-4 text-rose-500" />;
                        bgClass = 'bg-rose-500/10 text-rose-500';
                      } else if (upper.includes('SOCIAL') || upper.includes('PLATFORM')) {
                        iconNode = <Share2 className="w-4 h-4 text-indigo-500" />;
                        bgClass = 'bg-indigo-500/10 text-indigo-500';
                      } else if (upper.includes('SUBSCRIPTION') || upper.includes('PAYMENT')) {
                        iconNode = <CreditCard className="w-4 h-4 text-amber-500" />;
                        bgClass = 'bg-amber-500/10 text-amber-500';
                      } else if (upper.includes('MEMBER') || upper.includes('USER') || upper.includes('WORKSPACE')) {
                        iconNode = <Users className="w-4 h-4 text-blue-500" />;
                        bgClass = 'bg-blue-500/10 text-blue-500';
                      }

                      return (
                        <div
                          key={act.id}
                          className="flex items-center justify-between gap-3 p-3.5 sm:px-5 hover:bg-accent/25 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', bgClass)}>
                              {iconNode}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                                {act.description || act.action.replace(/_/g, ' ')}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {act.module || 'Workspace'}
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] text-muted-foreground/80 shrink-0 font-medium whitespace-nowrap">
                            {formatRelativeTime(act.createdAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right 4 Columns: Connected Channels & Quick Launch */}
          <div className="lg:col-span-4 space-y-6">
            {/* Connected Channels & Platform Health */}
            <Card className="glass-panel border-border/50 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-pink-500" />
                    <CardTitle className="text-base font-bold">Streaming Channels</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0.5">
                    {accounts.length} / 4 Linked
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  Multi-destination live destinations
                </CardDescription>
              </CardHeader>

              <CardContent className="p-3 space-y-2.5">
                {PRIMARY_PLATFORMS.map((platform) => {
                  const config = PLATFORM_CONFIG[platform];
                  const linkedAccount = accounts.find((a) => a.platform === platform);
                  const isLinked = !!linkedAccount;

                  return (
                    <div
                      key={platform}
                      className={cn(
                        'flex items-center justify-between p-2.5 rounded-xl border transition-all duration-150',
                        isLinked
                          ? 'border-border/50 bg-card hover:bg-accent/30'
                          : 'border-dashed border-border/40 bg-muted/20 hover:bg-muted/40'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-xs shrink-0',
                            isLinked ? `bg-gradient-to-tr ${config.gradient} text-white` : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {config.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{config.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {isLinked ? linkedAccount.accountName || 'Active channel' : 'Not connected'}
                          </p>
                        </div>
                      </div>

                      {isLinked ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Ready
                        </span>
                      ) : (
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2.5 text-xs text-primary hover:bg-primary/10 shrink-0"
                        >
                          <Link href="/social">
                            Connect
                            <Plus className="w-3 h-3 ml-1" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  );
                })}

                <Button asChild variant="outline" size="sm" className="w-full h-8 text-xs mt-2">
                  <Link href="/social" className="flex items-center justify-center gap-1.5">
                    <span>Manage All Social Accounts</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Studio Launchpad Shortcuts */}
            <Card className="glass-panel border-border/50 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base font-bold">Studio Launchpad</CardTitle>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  Frequently accessed workspace tools
                </CardDescription>
              </CardHeader>

              <CardContent className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
                <Link
                  href="/streams/new"
                  className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card hover:bg-accent/40 hover:border-primary/40 transition-all duration-150 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        New Broadcast
                      </p>
                      <p className="text-[11px] text-muted-foreground">Setup live studio stream</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                </Link>

                <Link
                  href="/social"
                  className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card hover:bg-accent/40 hover:border-primary/40 transition-all duration-150 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        Social Connections
                      </p>
                      <p className="text-[11px] text-muted-foreground">Manage OAuth channels</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                </Link>

                <Link
                  href="/team"
                  className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card hover:bg-accent/40 hover:border-primary/40 transition-all duration-150 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        Team Members
                      </p>
                      <p className="text-[11px] text-muted-foreground">Collaborators & roles</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                </Link>

                <Link
                  href="/billing"
                  className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card hover:bg-accent/40 hover:border-primary/40 transition-all duration-150 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        Plan & Billing
                      </p>
                      <p className="text-[11px] text-muted-foreground">Invoices & quota limits</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB 2: Broadcast Studio (On-demand deep dive for streaming) ─── */}
      {activeTab === 'studio' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <Card className="glass-panel border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Radio className="w-5 h-5 text-rose-500" />
                  Live Broadcast Sessions
                </CardTitle>
                <CardDescription className="text-xs">
                  Active and upcoming multi-destination broadcasts for {currentWorkspace.name}
                </CardDescription>
              </div>
              <Button asChild size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold">
                <Link href="/streams/new">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  New Broadcast
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {allDisplayStreams.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground space-y-3">
                  <Video className="w-10 h-10 mx-auto text-muted-foreground/40" />
                  <p>No active or scheduled streams in this workspace.</p>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/streams/new">Create your first stream</Link>
                  </Button>
                </div>
              ) : (
                allDisplayStreams.map((stream) => {
                  const isLive = stream.status === 'LIVE';
                  return (
                    <div
                      key={stream.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-xl border border-border/40 bg-card/40 hover:bg-card/70 transition-colors gap-3"
                    >
                      <div className="space-y-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                              isLive
                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 animate-pulse'
                                : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                            )}
                          >
                            {isLive ? 'LIVE NOW' : 'SCHEDULED'}
                          </span>
                          <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate">
                            {stream.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                          <span>Destinations: {stream.platforms.length > 0 ? stream.platforms.join(', ') : 'Direct RTMP'}</span>
                          <span>•</span>
                          <span>
                            {isLive
                              ? `Started ${formatRelativeTime(stream.startedAt)}`
                              : `Scheduled ${formatRelativeTime(stream.scheduledAt)}`}
                          </span>
                        </div>
                      </div>
                      <Button
                        asChild
                        size="sm"
                        variant={isLive ? 'default' : 'outline'}
                        className={cn(
                          'text-xs h-8 shrink-0 font-semibold',
                          isLive && 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-sm'
                        )}
                      >
                        <Link href={`/streams/${stream.id}`}>
                          {isLive ? 'Open Studio' : 'Setup Details'}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 3: Audience Breakdown (On-demand deep dive) ───────────── */}
      {activeTab === 'audience' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Platform Audience Breakdown</CardTitle>
              <CardDescription className="text-xs">
                Follower distribution across your connected social platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isOverviewLoading ? (
                <DashboardChartSkeleton />
              ) : (
                <PlatformChart data={overview?.platformBreakdown} />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
