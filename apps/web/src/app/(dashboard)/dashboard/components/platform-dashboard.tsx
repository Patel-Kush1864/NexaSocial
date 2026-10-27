'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { useSystemHealth } from '@/hooks/use-system-health';
import { usePlatformActivity } from '@/hooks/use-activity';
import { useAuthStore } from '@/stores/auth-store';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { DashboardKpiCard } from '@/components/dashboard/dashboard-kpi-card';
import { TimeSeriesChart } from '@/components/analytics/time-series-chart';
import { DashboardChartSkeleton } from '@/components/dashboard/skeletons/dashboard-chart-skeleton';
import { DashboardActivitySkeleton } from '@/components/dashboard/skeletons/dashboard-activity-skeleton';
import { LiveStreamAnalytics } from '@/components/analytics/live-stream-analytics';
import { SocialPlatformAnalytics } from '@/components/analytics/social-platform-analytics';
import { SystemHealth } from '@/components/admin/system-health';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Building2,
  CreditCard,
  TrendingUp,
  Radio,
  Share2,
  Activity,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Server,
  Database,
  Layers,
  ArrowUpRight,
  SlidersHorizontal,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatNumber, cn } from '@/lib/utils';
import { PlatformDashboardSummary } from '@/types';
import { UserAnalyticsRange } from '@/types/analytics';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function PlatformDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'streaming' | 'system'>('overview');
  const [growthRange, setGrowthRange] = useState<UserAnalyticsRange>('30d');

  // 1. Fetch core platform KPI summary
  const {
    data: kpis,
    isLoading: isKpisLoading,
    isError: isKpisError,
    refetch: refetchKpis,
    isFetching: isKpisFetching,
  } = useQuery<PlatformDashboardSummary>({
    queryKey: ['platform-summary'],
    queryFn: () => dashboardService.getSummary() as unknown as Promise<PlatformDashboardSummary>,
    refetchInterval: 60000,
  });

  // 2. Fetch platform growth chart data (for the selected range)
  const {
    data: growthData,
    isLoading: isGrowthLoading,
    refetch: refetchGrowth,
  } = useQuery({
    queryKey: ['user-analytics', growthRange],
    queryFn: () => dashboardService.getUserAnalytics(growthRange),
  });

  // 3. Fetch system health summary
  const {
    data: systemHealth,
    isLoading: isHealthLoading,
    refetch: refetchHealth,
  } = useSystemHealth();

  // 4. Fetch latest 5 platform activities
  const {
    data: recentActivities,
    isLoading: isActivitiesLoading,
    refetch: refetchActivities,
  } = usePlatformActivity({ page: 1, limit: 5 });

  const handleRefreshAll = () => {
    refetchKpis();
    refetchGrowth();
    refetchHealth();
    refetchActivities();
  };

  // Greeting based on current local hour
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour >= 5 && hour < 12) greeting = 'Good morning';
  else if (hour >= 12 && hour < 17) greeting = 'Good afternoon';

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Health status helper
  const isHealthy = systemHealth?.overallStatus === 'HEALTHY' || (!systemHealth && !isHealthLoading);
  const isDegraded = systemHealth?.overallStatus === 'DEGRADED';
  const isUnhealthy = systemHealth?.overallStatus === 'UNHEALTHY';

  if (isKpisError) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-border/50">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Platform control & analytics overview.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => handleRefreshAll()} className="h-9 gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry Connection
          </Button>
        </div>

        <div className="p-6 border border-destructive/30 bg-destructive/5 text-destructive rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 shrink-0" />
            <div>
              <h5 className="font-semibold text-base">Unable to connect to platform telemetry</h5>
              <p className="text-sm opacity-90 mt-0.5">Failed to retrieve real-time summary statistics.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => handleRefreshAll()} className="shrink-0">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="platform.dashboard.view">
      <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-1 sm:px-4 pb-12">
        {/* ── Top Header & Executive Command Bar ────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border/40">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {greeting}, <span className="gradient-text">{user?.firstName || 'Admin'}</span>
              </h1>
              <Badge variant="outline" className="hidden sm:inline-flex bg-primary/5 text-primary border-primary/20 text-xs px-2.5 py-0.5 font-medium">
                Super Admin
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-2">
              <span>{todayFormatted}</span>
              <span className="hidden sm:inline text-muted-foreground/40">•</span>
              <span className="hidden sm:inline">NexaSocial Global Platform Administration</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live System Health Badge */}
            <Link
              href="/admin/system-health"
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:shadow-sm',
                isHealthy && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
                isDegraded && 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
                isUnhealthy && 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
              )}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={cn(
                    'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                    isHealthy && 'bg-emerald-400',
                    isDegraded && 'bg-amber-400',
                    isUnhealthy && 'bg-rose-400'
                  )}
                />
                <span
                  className={cn(
                    'relative inline-flex rounded-full h-2 w-2',
                    isHealthy && 'bg-emerald-500',
                    isDegraded && 'bg-amber-500',
                    isUnhealthy && 'bg-rose-500'
                  )}
                />
              </span>
              <span>
                {isHealthy ? 'All Systems Operational' : isDegraded ? 'Systems Degraded' : 'System Issue Detected'}
              </span>
            </Link>

            {/* Quick Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={isKpisFetching}
              className="h-8 sm:h-9 px-3 gap-1.5 text-xs font-medium border-border/60 hover:bg-accent"
              title="Refresh platform statistics"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isKpisFetching && 'animate-spin text-primary')} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            {/* Quick Action Link */}
            <Button asChild size="sm" className="h-8 sm:h-9 px-3.5 text-xs font-medium shadow-sm">
              <Link href="/admin/users">
                <Users className="w-3.5 h-3.5 mr-1.5" />
                Manage Users
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Core Executive KPIs (4 Primary Business Pillars) ──────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <DashboardKpiCard
            title="Total Users"
            value={formatNumber(kpis?.totalUsers?.value || 0)}
            change={kpis?.totalUsers?.change || 0}
            direction={kpis?.totalUsers?.direction || 'neutral'}
            subtitle="Registered platform accounts"
            icon={Users}
            gradient="from-blue-600 to-cyan-500"
            href="/admin/users"
            isLoading={isKpisLoading}
          />
          <DashboardKpiCard
            title="Active Workspaces"
            value={formatNumber(kpis?.workspaces?.value || 0)}
            change={kpis?.workspaces?.change || 0}
            direction={kpis?.workspaces?.direction || 'neutral'}
            subtitle="Organizations & creator teams"
            icon={Building2}
            gradient="from-violet-600 to-indigo-600"
            href="/admin/workspaces"
            isLoading={isKpisLoading}
          />
          <DashboardKpiCard
            title="Active Subscriptions"
            value={formatNumber(kpis?.subscriptions?.value || 0)}
            change={kpis?.subscriptions?.change || 0}
            direction={kpis?.subscriptions?.direction || 'neutral'}
            subtitle="Paying subscriber accounts"
            icon={CreditCard}
            gradient="from-emerald-500 to-teal-600"
            href="/subscriptions"
            isLoading={isKpisLoading}
          />
          <DashboardKpiCard
            title="Monthly Revenue"
            value={formatCurrency(Number(kpis?.revenue?.value || 0), kpis?.revenue?.currency || 'INR')}
            change={kpis?.revenue?.change || 0}
            direction={kpis?.revenue?.direction || 'neutral'}
            subtitle="Total gross processed volume"
            icon={TrendingUp}
            gradient="from-amber-500 to-emerald-600"
            href="/admin/payments"
            isLoading={isKpisLoading}
          />
        </div>

        {/* ── Compact Operational Vitals Strip ───────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-card border border-border/50 shadow-xs">
          {/* Live Streams */}
          <Link
            href="/live-streams"
            className="flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 hover:bg-accent/40 group"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0 text-rose-500 transition-transform group-hover:scale-105">
              <Radio className={cn('w-4 h-4', (kpis?.liveStreams?.value || 0) > 0 && 'animate-pulse text-rose-500')} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-medium">Broadcasts</span>
                {(kpis?.liveStreams?.value || 0) > 0 && (
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                )}
              </div>
              <p className="text-sm sm:text-base font-bold text-foreground truncate">
                {formatNumber(kpis?.liveStreams?.value || 0)} Live Now
              </p>
            </div>
          </Link>

          {/* Connected Channels */}
          <Link
            href="/connected-accounts"
            className="flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 hover:bg-accent/40 group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 text-indigo-500 transition-transform group-hover:scale-105">
              <Share2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs text-muted-foreground font-medium">Connected</span>
              <p className="text-sm sm:text-base font-bold text-foreground truncate">
                {formatNumber(kpis?.connectedAccounts?.value || 0)} Accounts
              </p>
            </div>
          </Link>

          {/* Active Users */}
          <Link
            href="/admin/users"
            className="flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 hover:bg-accent/40 group"
          >
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center shrink-0 text-pink-500 transition-transform group-hover:scale-105">
              <Activity className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs text-muted-foreground font-medium">30d Active</span>
              <p className="text-sm sm:text-base font-bold text-foreground truncate">
                {formatNumber(kpis?.activeUsers?.value || 0)} Users
              </p>
            </div>
          </Link>

          {/* Payment Status */}
          <Link
            href="/admin/payments"
            className="flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 hover:bg-accent/40 group"
          >
            <div
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
                (kpis?.failedPayments?.value || 0) > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
              )}
            >
              {(kpis?.failedPayments?.value || 0) > 0 ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs text-muted-foreground font-medium">Payment Health</span>
              <p
                className={cn(
                  'text-sm sm:text-base font-bold truncate',
                  (kpis?.failedPayments?.value || 0) > 0 ? 'text-amber-500' : 'text-foreground'
                )}
              >
                {(kpis?.failedPayments?.value || 0) > 0
                  ? `${kpis?.failedPayments?.value} Failed`
                  : '100% Succeeded'}
              </p>
            </div>
          </Link>
        </div>

        {/* ── View Mode Selector (Unclutters the dashboard) ─────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
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
              Platform Overview
            </button>
            <button
              onClick={() => setActiveTab('streaming')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150',
                activeTab === 'streaming'
                  ? 'bg-background text-foreground shadow-xs border border-border/40'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Streams & Channels
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150',
                activeTab === 'system'
                  ? 'bg-background text-foreground shadow-xs border border-border/40'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              System Health
            </button>
          </div>

          <div className="text-xs text-muted-foreground/80 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Telemetry auto-synced every 60s</span>
          </div>
        </div>

        {/* ── TAB 1: Platform Overview (Clean, focused, only required data) ─ */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Columns: Growth Chart & Activity */}
            <div className="lg:col-span-8 space-y-6">
              {/* Platform Growth Trend */}
              <Card className="glass-panel border-border/50 shadow-xs overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/30">
                  <div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <CardTitle className="text-base sm:text-lg font-bold">Platform User Growth</CardTitle>
                    </div>
                    <CardDescription className="text-xs mt-0.5">
                      New user acquisitions and account registrations over time
                    </CardDescription>
                  </div>

                  {/* Range Selector */}
                  <div className="flex items-center gap-1 bg-background/50 border border-border/50 rounded-lg p-0.5 self-start sm:self-auto">
                    {(['7d', '30d', '3m'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setGrowthRange(r)}
                        className={cn(
                          'px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                          growthRange === r
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
                  {isGrowthLoading ? (
                    <DashboardChartSkeleton />
                  ) : (
                    <div className="space-y-4">
                      {/* Metric sub-summary pill */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-xl">
                        <div>
                          Total in Scope:{' '}
                          <span className="font-semibold text-foreground">
                            {formatNumber(growthData?.summary?.totalUsers || kpis?.totalUsers?.value || 0)}
                          </span>
                        </div>
                        <div>
                          New Additions:{' '}
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            +{formatNumber(growthData?.summary?.newUsers || 0)}
                          </span>
                        </div>
                        <div>
                          Active Users:{' '}
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {formatNumber(growthData?.summary?.activeUsers || kpis?.activeUsers?.value || 0)}
                          </span>
                        </div>
                      </div>

                      <div className="h-[280px] w-full min-w-0">
                        <TimeSeriesChart
                          data={growthData?.growth || []}
                          xKey="date"
                          yKey="users"
                          tooltipLabel="Total Users"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2 border-t border-border/20">
                    <Link
                      href="/admin/users"
                      className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <span>Explore full user directory & filters</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity (Concise 5 Items) */}
              <Card className="glass-panel border-border/50 shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/30">
                  <div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <CardTitle className="text-base sm:text-lg font-bold">Recent Platform Activity</CardTitle>
                    </div>
                    <CardDescription className="text-xs mt-0.5">
                      Real-time events across workspaces and users
                    </CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="h-8 text-xs gap-1">
                    <Link href="/admin/activity">
                      View All
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </CardHeader>

                <CardContent className="p-0">
                  {isActivitiesLoading ? (
                    <div className="p-4">
                      <DashboardActivitySkeleton rows={5} />
                    </div>
                  ) : !recentActivities || recentActivities.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No platform events recorded yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/30">
                      {recentActivities.slice(0, 5).map((act) => {
                        let iconNode = <Activity className="w-4 h-4 text-slate-500" />;
                        let bgClass = 'bg-slate-500/10';

                        if (act.module === 'USER') {
                          iconNode = <Users className="w-4 h-4 text-blue-500" />;
                          bgClass = 'bg-blue-500/10';
                        } else if (act.module === 'WORKSPACE') {
                          iconNode = <Building2 className="w-4 h-4 text-emerald-500" />;
                          bgClass = 'bg-emerald-500/10';
                        } else if (act.module === 'PAYMENT') {
                          iconNode = <CreditCard className="w-4 h-4 text-amber-500" />;
                          bgClass = 'bg-amber-500/10';
                        } else if (act.module === 'SUBSCRIPTION') {
                          iconNode = <Sparkles className="w-4 h-4 text-purple-500" />;
                          bgClass = 'bg-purple-500/10';
                        } else if (act.module === 'STREAM') {
                          iconNode = <Radio className="w-4 h-4 text-rose-500" />;
                          bgClass = 'bg-rose-500/10';
                        } else if (act.module === 'SOCIAL') {
                          iconNode = <Share2 className="w-4 h-4 text-indigo-500" />;
                          bgClass = 'bg-indigo-500/10';
                        }

                        const timeAgo = act.created_at ? dayjs(act.created_at).fromNow() : 'Recently';

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
                                  {act.workspace?.name || act.user?.name || act.user?.email || 'Platform System'}
                                </p>
                              </div>
                            </div>
                            <span className="text-[11px] text-muted-foreground/80 shrink-0 font-medium whitespace-nowrap">
                              {timeAgo}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="p-3 bg-muted/20 border-t border-border/30 text-center">
                    <Link
                      href="/admin/audit-logs"
                      className="text-xs text-muted-foreground hover:text-foreground font-medium inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Open platform security audit trail</span>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right 4 Columns: System Health & Shortcuts */}
            <div className="lg:col-span-4 space-y-6">
              {/* Infrastructure & Service Health Widget */}
              <Card className="glass-panel border-border/50 shadow-xs">
                <CardHeader className="pb-3 border-b border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-emerald-500" />
                      <CardTitle className="text-base font-bold">Platform Services</CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-semibold px-2 py-0.5',
                        isHealthy && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
                        isDegraded && 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
                        isUnhealthy && 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                      )}
                    >
                      {systemHealth?.overallStatus || 'HEALTHY'}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-0.5">
                    Core backend subsystems status
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                  {/* Service 1: Database */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-accent/20 border border-border/30">
                    <div className="flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">PostgreSQL Database</p>
                        <p className="text-[11px] text-muted-foreground">Primary cluster</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Online
                    </span>
                  </div>

                  {/* Service 2: Redis Cache */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-accent/20 border border-border/30">
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-4 h-4 text-indigo-500" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">Redis Cache & Queues</p>
                        <p className="text-[11px] text-muted-foreground">BullMQ & session cache</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active
                    </span>
                  </div>

                  {/* Service 3: API Gateway */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-accent/20 border border-border/30">
                    <div className="flex items-center gap-2.5">
                      <Server className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">API Gateway / Auth</p>
                        <p className="text-[11px] text-muted-foreground">REST & JWT Engine</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Healthy
                    </span>
                  </div>

                  {/* Service 4: Media & Stream Engine */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-accent/20 border border-border/30">
                    <div className="flex items-center gap-2.5">
                      <Radio className="w-4 h-4 text-rose-500" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">Live Streaming Gateway</p>
                        <p className="text-[11px] text-muted-foreground">RTMP & ingest proxy</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Ready
                    </span>
                  </div>

                  <Button asChild variant="outline" size="sm" className="w-full h-8 text-xs mt-2">
                    <Link href="/admin/system-health" className="flex items-center justify-center gap-1.5">
                      <span>Full Diagnostic Panel</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Admin Navigation Shortcuts */}
              <Card className="glass-panel border-border/50 shadow-xs">
                <CardHeader className="pb-3 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-primary" />
                    <CardTitle className="text-base font-bold">Admin Management</CardTitle>
                  </div>
                  <CardDescription className="text-xs mt-0.5">
                    Fast access to critical operations
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
                  <Link
                    href="/admin/users"
                    className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card hover:bg-accent/40 hover:border-primary/40 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                          User Directory
                        </p>
                        <p className="text-[11px] text-muted-foreground">Manage roles & statuses</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                  </Link>

                  <Link
                    href="/admin/workspaces"
                    className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card hover:bg-accent/40 hover:border-primary/40 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                          Workspaces
                        </p>
                        <p className="text-[11px] text-muted-foreground">Teams, members & storage</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                  </Link>

                  <Link
                    href="/admin/plans"
                    className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card hover:bg-accent/40 hover:border-primary/40 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                          Plans & Pricing
                        </p>
                        <p className="text-[11px] text-muted-foreground">Tiers, features & limits</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                  </Link>

                  <Link
                    href="/admin/audit-logs"
                    className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card hover:bg-accent/40 hover:border-primary/40 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                          Security & Audit
                        </p>
                        <p className="text-[11px] text-muted-foreground">Compliance audit trails</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── TAB 2: Streams & Channels (On-demand view, never clutters main) ─ */}
        {activeTab === 'streaming' && (
          <div className="space-y-8 animate-in fade-in-50 duration-200">
            <LiveStreamAnalytics />
            <div className="pt-6 border-t border-border/40">
              <SocialPlatformAnalytics />
            </div>
          </div>
        )}

        {/* ── TAB 3: System Health (On-demand view for deep diagnostics) ──── */}
        {activeTab === 'system' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <SystemHealth />
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
