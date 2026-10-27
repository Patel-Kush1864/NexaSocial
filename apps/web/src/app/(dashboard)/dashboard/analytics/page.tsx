'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useSocialAccounts } from '@/hooks/use-social';
import { useStreams } from '@/hooks/use-streams';
import { dashboardService } from '@/services/dashboard.service';
import { queryKeys } from '@/lib/query-client';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/cards/stat-card';
import { OverviewChart } from '@/components/charts/overview-chart';
import { PlatformChart } from '@/components/charts/platform-chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import {
  Users,
  Eye,
  Radio,
  Share2,
  Download,
  Calendar,
  RefreshCw,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  ExternalLink,
  Clock,
  Sparkles,
  Video,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { toast } from 'sonner';
import type { SocialPlatform } from '@/types';

type RangeOption = '7d' | '30d' | '90d';

const PLATFORM_DEFINITIONS: Array<{
  id: SocialPlatform;
  name: string;
  color: string;
  badgeColor: string;
  iconBg: string;
}> = [
  {
    id: 'YOUTUBE',
    name: 'YouTube',
    color: '#FF0000',
    badgeColor: 'text-red-400 bg-red-500/10 border-red-500/20',
    iconBg: 'from-red-600 to-rose-700',
  },
  {
    id: 'FACEBOOK',
    name: 'Facebook',
    color: '#1877F2',
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    iconBg: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'INSTAGRAM',
    name: 'Instagram',
    color: '#E4405F',
    badgeColor: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    iconBg: 'from-pink-600 via-purple-600 to-orange-600',
  },
  {
    id: 'X',
    name: 'X (Twitter)',
    color: '#1DA1F2',
    badgeColor: 'text-slate-300 bg-slate-500/10 border-slate-500/20',
    iconBg: 'from-slate-700 to-zinc-900',
  },
];

export function AnalyticsPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const [range, setRange] = useState<RangeOption>('30d');

  // Fetch real workspace overview analytics
  const {
    data: overview,
    isLoading: isOverviewLoading,
    isRefetching: isOverviewRefetching,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: queryKeys.dashboard.overview(currentWorkspace?.id || '', range),
    queryFn: () => dashboardService.getOverview(currentWorkspace!.id, range),
    enabled: !!currentWorkspace?.id,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  // Fetch real connected social accounts
  const {
    accounts,
    isLoading: isAccountsLoading,
  } = useSocialAccounts(currentWorkspace?.id);

  // Fetch real workspace streams telemetry
  const {
    streams,
    isLoading: isStreamsLoading,
    refetch: refetchStreams,
    isRefetching: isStreamsRefetching,
  } = useStreams(currentWorkspace?.id);

  const isSyncing = isOverviewRefetching || isStreamsRefetching;
  const isLoading = (isOverviewLoading && !overview) || isAccountsLoading || isStreamsLoading;

  // Real-time calculations
  const liveStreams = useMemo(() => streams.filter((s) => s.status === 'LIVE'), [streams]);
  const realLiveViewers = useMemo(
    () => liveStreams.reduce((acc, s) => acc + (s.viewerCount || 0), 0),
    [liveStreams],
  );
  const realPeakViewers = useMemo(
    () => (streams.length > 0 ? Math.max(0, ...streams.map((s) => s.peakViewerCount || s.viewerCount || 0)) : 0),
    [streams],
  );

  const activeAccounts = useMemo(() => accounts.filter((a) => a.isActive), [accounts]);
  const totalFollowers = useMemo(() => {
    if (overview?.kpis?.totalFollowers?.hasData && overview.kpis.totalFollowers.value > 0) {
      return overview.kpis.totalFollowers.value;
    }
    return accounts.reduce((acc, a) => acc + (a.followerCount || 0), 0);
  }, [overview?.kpis?.totalFollowers, accounts]);

  // Real platform breakdown for pie chart
  const platformStats = useMemo(() => {
    if (overview?.platformBreakdown && overview.platformBreakdown.length > 0) {
      return overview.platformBreakdown;
    }
    if (!accounts || accounts.length === 0) return [];
    const total = accounts.reduce((acc, a) => acc + (a.followerCount || 0), 0);
    return accounts.map((a) => {
      const p = (a.platform || a.platformName || 'X').toUpperCase() as SocialPlatform;
      return {
        platform: p,
        followers: a.followerCount || 0,
        engagement: 0,
        percentage: total > 0 ? Math.round(((a.followerCount || 0) / total) * 100) : 0,
      };
    });
  }, [overview?.platformBreakdown, accounts]);

  // Export report as CSV with 100% real workspace telemetry
  const handleExportReport = () => {
    try {
      const rows = [
        ['NexaSocial Analytics Report'],
        ['Workspace', currentWorkspace?.name || 'Default Workspace'],
        ['Timeframe', range],
        ['Exported At', new Date().toISOString()],
        [''],
        ['METRIC SUMMARY', 'VALUE'],
        ['Total Audience / Followers', totalFollowers.toString()],
        ['Connected Accounts', accounts.length.toString()],
        ['Active Broadcasting Streams', liveStreams.length.toString()],
        ['Total Live Streams Created', streams.length.toString()],
        ['Current Live Viewers', realLiveViewers.toString()],
        ['All-Time Peak Viewers', realPeakViewers.toString()],
        [''],
        ['CONNECTED PLATFORMS', 'ACCOUNT NAME', 'FOLLOWERS', 'STATUS'],
        ...accounts.map((a) => [
          a.platform || a.platformName || 'Unknown',
          a.accountName || a.name || 'Unnamed',
          (a.followerCount || 0).toString(),
          a.isActive ? 'Active' : 'Disconnected',
        ]),
        [''],
        ['STREAMS TELEMETRY', 'STATUS', 'VIEWERS', 'SCHEDULED / STARTED AT'],
        ...streams.map((s) => [
          s.title,
          s.status,
          (s.viewerCount || 0).toString(),
          s.scheduledAt || s.startedAt || s.createdAt || 'N/A',
        ]),
      ];

      const csvContent = rows.map((r) => r.map((cell) => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `nexasocial-analytics-${range}-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Analytics report exported successfully');
    } catch {
      toast.error('Failed to export report');
    }
  };

  const handleSyncData = async () => {
    await Promise.all([refetchOverview(), refetchStreams()]);
    toast.success('Live analytics data refreshed');
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading real-time analytics data..." />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header with Real Live Sync & Responsive Actions */}
      <PageHeader
        title={
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <span>Cross-Platform Analytics</span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>LIVE TELEMETRY</span>
            </div>
          </div>
        }
        description="Comprehensive engagement, audience growth, and multi-channel broadcast reach in real time."
        action={
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
            {/* Range Selector */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-card/60 border border-border/50 text-xs">
              {(['7d', '30d', '90d'] as RangeOption[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setRange(opt)}
                  className={cn(
                    'px-2.5 py-1 rounded-md font-semibold transition-all',
                    range === opt
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {opt === '7d' ? '7 Days' : opt === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>

            {/* Sync Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncData}
              disabled={isSyncing}
              className="h-8 sm:h-9 text-xs border-border/60 hover:bg-secondary/60 transition-all"
              title="Refresh real-time telemetry from connected accounts"
            >
              <RefreshCw
                className={cn('w-3.5 h-3.5 mr-1.5', isSyncing && 'animate-spin text-primary')}
              />
              <span className="hidden xs:inline">{isSyncing ? 'Syncing...' : 'Sync Data'}</span>
              <span className="xs:hidden">Sync</span>
            </Button>

            {/* Export Report Button */}
            <Button
              size="sm"
              onClick={handleExportReport}
              className="h-8 sm:h-9 text-xs bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold shadow-md shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 transition-all"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export Report
            </Button>
          </div>
        }
      />

      {/* Top Stat Cards — 100% Real Workspace Data (Zero Static Mock Values) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Audience"
          value={totalFollowers > 0 ? totalFollowers.toLocaleString() : '0'}
          change={
            accounts.length > 0
              ? `${accounts.length} linked account${accounts.length > 1 ? 's' : ''}`
              : 'No accounts'
          }
          changeLabel="synchronized"
          showTrendIcon={false}
          isPositive={totalFollowers > 0}
          icon={Users}
          gradient="from-violet-600 to-indigo-600"
        />

        <StatCard
          title="Connected Channels"
          value={accounts.length}
          change={activeAccounts.length > 0 ? `${activeAccounts.length} Active` : '0 Active'}
          changeLabel="ready to broadcast"
          showTrendIcon={false}
          isPositive={activeAccounts.length > 0}
          icon={Share2}
          gradient="from-blue-600 to-cyan-600"
        />

        <StatCard
          title="Live Broadcasts"
          value={liveStreams.length}
          change={liveStreams.length > 0 ? `${liveStreams.length} Broadcasting` : 'Offline'}
          changeLabel={liveStreams.length > 0 ? 'transmitting video now' : 'no active streams'}
          showTrendIcon={false}
          isPositive={liveStreams.length > 0}
          icon={Radio}
          gradient="from-rose-600 to-pink-600"
          badge={
            liveStreams.length > 0 ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
            ) : undefined
          }
        />

        <StatCard
          title="Stream Sessions & Reach"
          value={streams.length}
          change={
            liveStreams.length > 0
              ? `${realLiveViewers.toLocaleString()} Live Viewers`
              : `Peak: ${realPeakViewers.toLocaleString()}`
          }
          changeLabel={liveStreams.length > 0 ? 'watching in real time' : 'all-time peak'}
          showTrendIcon={false}
          isPositive={streams.length > 0}
          icon={Eye}
          gradient="from-amber-500 to-orange-600"
        />
      </div>

      {/* Channel Connections Telemetry Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-foreground">
            <Activity className="w-3.5 h-3.5 text-primary" />
            Channel Connection Status
          </span>
          <Link
            href="/social"
            className="text-primary hover:underline flex items-center gap-1 font-medium transition-colors"
          >
            Manage Accounts
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PLATFORM_DEFINITIONS.map((platform) => {
            const connectedAccount = accounts.find(
              (a) => (a.platform || a.platformName || '').toUpperCase() === platform.id,
            );
            const isConnected = !!connectedAccount;

            return (
              <div
                key={platform.id}
                className={cn(
                  'p-3.5 rounded-xl border glass-panel transition-all flex items-center justify-between gap-3',
                  isConnected
                    ? 'border-border/60 hover:border-primary/40'
                    : 'border-border/30 bg-card/20 hover:border-border/50',
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg bg-gradient-to-tr flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm',
                      platform.iconBg,
                    )}
                  >
                    {platform.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate text-foreground">
                      {platform.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {isConnected
                        ? connectedAccount.accountName || `${(connectedAccount.followerCount || 0).toLocaleString()} followers`
                        : 'Not connected'}
                    </p>
                  </div>
                </div>

                {isConnected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Active
                  </span>
                ) : (
                  <Link
                    href="/social"
                    className="text-[11px] font-semibold text-primary hover:underline shrink-0"
                  >
                    + Connect
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Grid — Audience Growth & Platform Share */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        <Card className="lg:col-span-2 glass-panel border-border/50 shadow-md">
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold">
                  Audience Growth & Reach Over Time
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Daily trend of audience interactions across all linked channels ({range})
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] border-border/50 font-medium">
                {overview?.analytics?.hasAnalyticsData ? 'Real-Time Snapshots' : 'Collecting Snapshots'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <OverviewChart data={overview?.analytics?.followerGrowth} />
          </CardContent>
        </Card>

        <Card className="glass-panel border-border/50 shadow-md">
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg font-bold">
              Platform Audience Share
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Follower distribution across connected platforms
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <PlatformChart data={platformStats} />
          </CardContent>
        </Card>
      </div>

      {/* Live Stream Telemetry & Session Log */}
      <Card className="glass-panel border-border/50 shadow-md overflow-hidden">
        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border/30">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-500" />
                Live Broadcast Telemetry ({streams.length})
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Real-time status and telemetry for multi-destination broadcasts in this workspace
              </CardDescription>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 text-xs border-border/60"
            >
              <Link href="/streams">
                View Studio Hub
                <ArrowRight className="w-3 h-3 ml-1.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {streams.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Radio className="w-8 h-8 text-muted-foreground/60 mx-auto" />
              <p className="text-sm font-semibold text-foreground">No Streams Created Yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Create a live stream to start broadcasting simultaneously to YouTube, Facebook, and Instagram.
              </p>
              <div className="pt-2">
                <Button asChild size="sm" className="h-8 text-xs font-semibold">
                  <Link href="/streams/new">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Create Stream
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {streams.slice(0, 5).map((stream) => {
                const isLive = stream.status === 'LIVE';
                return (
                  <div
                    key={stream.id}
                    className="p-3.5 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/20 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-foreground truncate max-w-xs">
                          {stream.title}
                        </span>
                        {isLive ? (
                          <Badge className="bg-rose-600 text-white font-bold text-[9px] px-2 py-0 border-0 animate-pulse">
                            LIVE NOW
                          </Badge>
                        ) : stream.status === 'SCHEDULED' ? (
                          <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[9px] px-2 py-0">
                            Scheduled
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px] px-2 py-0">
                            {stream.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {stream.description || 'No description provided'}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs shrink-0 self-end sm:self-center">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users
                          className={cn('w-3.5 h-3.5', isLive ? 'text-rose-400' : 'text-violet-400')}
                        />
                        <span className={cn('font-medium', isLive && 'text-foreground font-bold')}>
                          {(stream.viewerCount || 0).toLocaleString()} viewers
                        </span>
                      </div>

                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs font-semibold hover:bg-primary/10 hover:text-primary"
                      >
                        <Link href={`/streams/${stream.id}`}>
                          Studio
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AnalyticsPage;
