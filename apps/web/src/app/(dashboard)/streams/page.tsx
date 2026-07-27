'use client';

import Link from 'next/link';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useStreams } from '@/hooks/use-streams';
import { PageHeader } from '@/components/shared/page-header';
import { StreamCard } from '@/components/cards/stream-card';
import { StatCard } from '@/components/cards/stat-card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { Radio, Plus, Calendar, Clock, Eye } from 'lucide-react';

export function StreamsPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const { streams, dashboardStats, isLoading, deleteStream } = useStreams(
    currentWorkspace?.id,
  );

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading live stream sessions..." />;
  }

  const liveStreams = streams.filter((s) => s.status === 'LIVE');
  const scheduledStreams = streams.filter((s) => s.status === 'SCHEDULED');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Live Streams"
        description="Schedule, broadcast, and control multi-destination streams in real time."
        action={
          <Button
            asChild
            className="h-10 text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-500/20"
          >
            <Link href="/streams/new">
              <Plus className="w-3.5 h-3.5 mr-2" />
              New Stream
            </Link>
          </Button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Live Now"
          value={dashboardStats?.liveNow || liveStreams.length}
          change="Broadcasting"
          isPositive={true}
          icon={Radio}
          gradient="from-rose-600 to-pink-600"
        />
        <StatCard
          title="Scheduled"
          value={dashboardStats?.scheduledToday || scheduledStreams.length}
          change="Upcoming"
          isPositive={true}
          icon={Calendar}
          gradient="from-blue-600 to-cyan-600"
        />
        <StatCard
          title="Total Streams"
          value={dashboardStats?.totalStreams || streams.length}
          change="All-time"
          isPositive={true}
          icon={Clock}
          gradient="from-violet-600 to-indigo-600"
        />
        <StatCard
          title="Peak Viewers"
          value={(dashboardStats?.totalViewers || 1420).toLocaleString()}
          change="Concurrent"
          isPositive={true}
          icon={Eye}
          gradient="from-amber-500 to-orange-600"
        />
      </div>

      {/* Streams Grid */}
      {streams.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No Live Streams Found"
          description="Create your first stream session to start broadcasting simultaneously to YouTube, Twitch, Facebook, and more."
        >
          <Button
            asChild
            className="mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold"
          >
            <Link href="/streams/new">
              <Plus className="w-4 h-4 mr-2" />
              Create Stream Studio
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {liveStreams.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold flex items-center gap-2 text-rose-500">
                <Radio className="w-5 h-5 animate-pulse" />
                Active Broadcasts ({liveStreams.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {liveStreams.map((s) => (
                  <StreamCard
                    key={s.id}
                    stream={s}
                    onDelete={(id) => deleteStream({ id, workspaceId: currentWorkspace!.id })}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-lg font-bold">All Streams ({streams.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {streams.map((s) => (
                <StreamCard
                  key={s.id}
                  stream={s}
                  onDelete={(id) => deleteStream({ id, workspaceId: currentWorkspace!.id })}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StreamsPage;
