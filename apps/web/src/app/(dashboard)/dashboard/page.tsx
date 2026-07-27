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
import { LoadingSpinner } from '@/components/shared/loading-spinner';
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

export default function DashboardPage() {
  const { currentWorkspace } = useWorkspaceStore();

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: queryKeys.dashboard.summary(currentWorkspace?.id || ''),
    queryFn: () => dashboardService.getSummary(currentWorkspace!.id),
    enabled: !!currentWorkspace?.id,
  });

  const { data: statistics, isLoading: isStatsLoading } = useQuery({
    queryKey: queryKeys.dashboard.statistics(currentWorkspace?.id || ''),
    queryFn: () => dashboardService.getStatistics(currentWorkspace!.id),
    enabled: !!currentWorkspace?.id,
  });

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

  if (isSummaryLoading || isStatsLoading) {
    return <LoadingSpinner size="lg" label="Gathering workspace analytics..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back to ${currentWorkspace.name}`}
        description="Here is your social media growth and broadcast summary for today."
        badge={currentWorkspace.slug}
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

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Followers"
          value={(summary?.totalFollowers || 35400).toLocaleString()}
          change="+12.4%"
          isPositive={true}
          icon={Users}
          gradient="from-violet-600 to-indigo-600"
        />
        <StatCard
          title="Engagement Rate"
          value={`${summary?.engagementRate || 4.8}%`}
          change="+0.6%"
          isPositive={true}
          icon={TrendingUp}
          gradient="from-emerald-500 to-teal-600"
        />
        <StatCard
          title="Connected Accounts"
          value={summary?.connectedAccounts || 6}
          change="All Synced"
          isPositive={true}
          icon={Share2}
          gradient="from-pink-500 to-rose-600"
        />
        <StatCard
          title="Active Live Streams"
          value={summary?.activeStreams || 2}
          change="Broadcasting Now"
          isPositive={true}
          icon={Radio}
          gradient="from-amber-500 to-orange-600"
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Audience Growth & Engagement</CardTitle>
            <CardDescription className="text-xs">
              Daily follower acquisitions across all connected platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OverviewChart data={statistics?.followerGrowth} />
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
            <PlatformChart data={statistics?.platformBreakdown} />
          </CardContent>
        </Card>
      </div>

      {/* Quick Stream & Activity Feed Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Streams Quick Control */}
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
            <div className="p-4 rounded-xl bg-accent/30 border border-border/40 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    LIVE NOW
                  </span>
                </div>
                <h4 className="text-sm font-bold">Q3 Product Launch Keynote</h4>
                <p className="text-xs text-muted-foreground">
                  Streaming to YouTube, Twitch, Facebook
                </p>
              </div>
              <Button asChild size="sm" className="bg-rose-600 hover:bg-rose-700 text-xs font-semibold">
                <Link href="/streams/live-1">Control Studio</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Log */}
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
              {[
                { time: '10m ago', text: 'YouTube account refreshed access tokens successfully.' },
                { time: '45m ago', text: 'Scheduled live stream "Tech Talk Episode 42" created.' },
                { time: '2h ago', text: 'New member Alex Chen joined workspace as Manager.' },
              ].map((act, i) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-foreground font-medium">{act.text}</p>
                    <p className="text-muted-foreground text-[10px]">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
