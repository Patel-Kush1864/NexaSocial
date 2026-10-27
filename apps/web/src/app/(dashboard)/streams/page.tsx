'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAuthStore } from '@/stores/auth-store';
import { useStreams } from '@/hooks/use-streams';
import { PageHeader } from '@/components/shared/page-header';
import { StreamCard } from '@/components/cards/stream-card';
import { StatCard } from '@/components/cards/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import {
  Radio,
  Plus,
  Clock,
  Eye,
  RefreshCw,
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  CheckCircle2,
  Tv,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'live' | 'ended';
type SortOption = 'newest' | 'oldest' | 'viewers';

export function StreamsPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const { hasPermission } = useAuthStore();
  const {
    streams,
    dashboardStats,
    isLoading,
    isRefetching,
    refetch,
    deleteStream,
  } = useStreams(currentWorkspace?.id);

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const canCreate = hasPermission('livestreams.create');
  const canDelete = hasPermission('livestreams.delete');

  // Filter streams dynamically by real-time status
  const liveStreams = useMemo(
    () => streams.filter((s) => s.status === 'LIVE'),
    [streams],
  );

  const endedStreams = useMemo(
    () => streams.filter((s) => s.status === 'ENDED' || s.status === 'CANCELLED'),
    [streams],
  );

  // Calculate REAL LIVE telemetry data (zero static/mock values)
  const realLiveNowCount = dashboardStats?.liveNow ?? liveStreams.length;
  const realTotalStreams = dashboardStats?.totalStreams ?? streams.length;

  // Real concurrent viewers across all active live streams
  const realLiveViewers = useMemo(() => {
    return liveStreams.reduce((acc, s) => acc + (s.viewerCount || 0), 0);
  }, [liveStreams]);

  // Real peak viewers recorded across workspace streams
  const realPeakViewers = useMemo(() => {
    if (streams.length === 0) return 0;
    return Math.max(0, ...streams.map((s) => s.peakViewerCount || s.viewerCount || 0));
  }, [streams]);

  // Filtered & sorted stream list
  const filteredStreams = useMemo(() => {
    return streams
      .filter((stream) => {
        // Tab filtering
        if (activeTab === 'live' && stream.status !== 'LIVE') return false;
        if (activeTab === 'ended' && stream.status !== 'ENDED' && stream.status !== 'CANCELLED') return false;

        // Search filtering
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchTitle = stream.title?.toLowerCase().includes(query);
          const matchDesc = stream.description?.toLowerCase().includes(query);
          const matchPlatform = stream.platforms?.some((p) =>
            (p.platform || p.platformName || '').toLowerCase().includes(query),
          );
          return matchTitle || matchDesc || matchPlatform;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        if (sortBy === 'viewers') {
          return (b.viewerCount || 0) - (a.viewerCount || 0);
        }
        return 0;
      });
  }, [streams, activeTab, searchQuery, sortBy]);

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Synchronizing real-time stream data..." />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header with Real-time Sync Telemetry */}
      <PageHeader
        title={
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <span>Live Streams</span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>LIVE SYNC</span>
            </div>
          </div>
        }
        description="Broadcast and control multi-destination live streams in real time."
        action={
          <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="h-9 text-xs border-border/60 hover:bg-secondary/60 transition-all"
              title="Refresh real-time data from server"
            >
              <RefreshCw
                className={cn('w-3.5 h-3.5 mr-1.5', isRefetching && 'animate-spin text-primary')}
              />
              <span className="hidden xs:inline">
                {isRefetching ? 'Syncing...' : 'Sync Data'}
              </span>
              <span className="xs:hidden">Sync</span>
            </Button>

            {canCreate && (
              <Button
                asChild
                className="h-9 sm:h-10 text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 transition-all shrink-0"
              >
                <Link href="/streams/new">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  New Stream
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {/* Metric Cards — 100% Real Live Telemetry (Scheduled Part Removed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <StatCard
          title="Live Now"
          value={realLiveNowCount}
          change={realLiveNowCount > 0 ? `${realLiveNowCount} Active` : 'Offline'}
          changeLabel={realLiveNowCount > 0 ? 'broadcasting now' : 'no active streams'}
          showTrendIcon={false}
          isPositive={realLiveNowCount > 0}
          icon={Radio}
          gradient="from-rose-600 to-pink-600"
          badge={
            realLiveNowCount > 0 ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
            ) : undefined
          }
        />

        <StatCard
          title="Live Viewers"
          value={realLiveViewers.toLocaleString()}
          change={realLiveNowCount > 0 ? `${realLiveViewers} Watching` : `Peak: ${realPeakViewers}`}
          changeLabel={realLiveNowCount > 0 ? 'concurrent audience' : 'all-time peak'}
          showTrendIcon={false}
          isPositive={realLiveNowCount > 0}
          icon={Eye}
          gradient="from-amber-500 to-orange-600"
        />

        <StatCard
          title="Total Streams"
          value={realTotalStreams}
          change={realTotalStreams === 1 ? '1 Session' : `${realTotalStreams} Sessions`}
          changeLabel="workspace history"
          showTrendIcon={false}
          isPositive={true}
          icon={Clock}
          gradient="from-violet-600 to-indigo-600"
        />
      </div>

      {/* Streams Management Section */}
      {streams.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No Live Streams Found"
          description="Create your first multi-destination stream session to broadcast simultaneously to YouTube, Facebook, Instagram, and X."
        >
          {canCreate && (
            <Button
              asChild
              className="mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold shadow-md shadow-violet-500/20"
            >
              <Link href="/streams/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Stream Studio
              </Link>
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="space-y-5">
          {/* Active Broadcasts Spotlight (if any stream is LIVE) */}
          {liveStreams.length > 0 && activeTab !== 'live' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-background to-pink-950/30 border border-rose-500/30 shadow-lg shadow-rose-950/20 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm sm:text-base">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                  </span>
                  Active Live Broadcasts ({liveStreams.length})
                </div>
                <Badge
                  variant="outline"
                  className="bg-rose-500/10 text-rose-300 border-rose-500/30 text-xs px-2.5 py-0.5"
                >
                  {realLiveViewers.toLocaleString()} total live viewers
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveStreams.map((s) => (
                  <StreamCard
                    key={s.id}
                    stream={s}
                    onDelete={
                      canDelete
                        ? (id) => deleteStream({ id, workspaceId: currentWorkspace!.id })
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Filter & Controls Bar (Scheduled Removed) */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 p-2 rounded-xl bg-card/40 border border-border/40 backdrop-blur-sm">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-1">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5',
                  activeTab === 'all'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
                )}
              >
                All Streams
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full',
                    activeTab === 'all' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {streams.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('live')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5',
                  activeTab === 'live'
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
                )}
              >
                <Radio className={cn('w-3 h-3', liveStreams.length > 0 && 'animate-pulse text-rose-400')} />
                Live Now
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                    activeTab === 'live'
                      ? 'bg-white/20 text-white'
                      : liveStreams.length > 0
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {liveStreams.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ended')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5',
                  activeTab === 'ended'
                    ? 'bg-secondary text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
                )}
              >
                <Clock className="w-3 h-3" />
                Past Sessions
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full',
                    activeTab === 'ended' ? 'bg-foreground/15 text-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {endedStreams.length}
                </span>
              </button>
            </div>

            {/* Search and Sort controls */}
            <div className="flex items-center gap-2 w-full md:w-auto px-1">
              <div className="relative flex-1 md:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search streams..."
                  className="h-8 pl-8 text-xs bg-background/50 border-border/50 focus-visible:ring-1"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="h-8 px-2.5 py-1 text-xs rounded-lg bg-background/50 border border-border/50 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  title="Sort streams"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="viewers">Viewers</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stream Cards Grid or Filtered Empty State */}
          {filteredStreams.length === 0 ? (
            <div className="rounded-2xl border border-border/50 bg-card/30 p-8 sm:p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary/60 flex items-center justify-center mx-auto text-muted-foreground">
                {activeTab === 'live' ? (
                  <Radio className="w-6 h-6 text-rose-400" />
                ) : activeTab === 'ended' ? (
                  <Clock className="w-6 h-6 text-violet-400" />
                ) : (
                  <Search className="w-6 h-6 text-muted-foreground" />
                )}
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h4 className="text-base font-bold text-foreground">
                  {activeTab === 'live'
                    ? 'No Streams Broadcasting Live'
                    : activeTab === 'ended'
                    ? 'No Past Sessions Found'
                    : searchQuery
                    ? 'No matching streams found'
                    : 'No streams in this view'}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {activeTab === 'live'
                    ? 'There are currently no active live broadcasts transmitting in this workspace. Start broadcasting now to stream to your connected channels.'
                    : activeTab === 'ended'
                    ? 'Completed stream broadcasts will appear here once ended.'
                    : searchQuery
                    ? `No streams matched "${searchQuery}". Clear your search term to see all streams.`
                    : 'Select another filter above or create a new live stream.'}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                {activeTab === 'live' && canCreate && (
                  <Button
                    asChild
                    size="sm"
                    className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-xs font-semibold"
                  >
                    <Link href="/streams/new">
                      <Radio className="w-3.5 h-3.5 mr-1.5" />
                      Go Live Now
                    </Link>
                  </Button>
                )}

                {activeTab !== 'all' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveTab('all');
                      setSearchQuery('');
                    }}
                    className="text-xs border-border/60"
                  >
                    View All Streams ({streams.length})
                  </Button>
                )}

                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="text-xs"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>
                  Showing {filteredStreams.length} of {streams.length} stream{streams.length === 1 ? '' : 's'}
                </span>
                {activeTab === 'live' && (
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                    </span>
                    Live Broadcast View Only
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {filteredStreams.map((s) => (
                  <StreamCard
                    key={s.id}
                    stream={s}
                    onDelete={
                      canDelete
                        ? (id) => deleteStream({ id, workspaceId: currentWorkspace!.id })
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StreamsPage;
