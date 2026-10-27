'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { DashboardKpiCard } from '@/components/dashboard/dashboard-kpi-card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Video, PlayCircle, CheckCircle2, XCircle, Clock, Users, Camera, Briefcase, MessageSquare, Gamepad2 } from 'lucide-react';
import { SocialPlatform } from '@/types/analytics';
import { formatRelativeTime } from '@/lib/utils';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { formatNumber } from '@/lib/utils';

const PlatformIcon = ({ platform, className }: { platform: SocialPlatform; className?: string }) => {
  switch (platform) {
    case 'YOUTUBE': return <Video className={className} />;
    case 'FACEBOOK': return <Users className={className} />;
    case 'INSTAGRAM': return <Camera className={className} />;
    case 'X': return <MessageSquare className={className} />;
    default: return <Video className={className} />;
  }
};

export function LiveStreamAnalytics() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['live-stream-analytics'],
    queryFn: () => dashboardService.getPlatformLiveStreamAnalytics(),
    refetchInterval: 30000, // Poll every 30 seconds
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Live Stream Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor live-stream activity across the NexaSocial platform.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isError ? (
        <ErrorState
          title="Error"
          message="Unable to load live stream data."
          onRetry={() => refetch()}
          className="my-12"
        />
      ) : !data && !isLoading ? (
        <EmptyState
          icon={Video}
          title="No streams found"
          description="No live streams have been created on NexaSocial yet."
          className="border-0 shadow-none bg-card"
        />
      ) : (
        <>
          <div>
            <h3 className="font-semibold leading-none tracking-tight mb-6 text-xl">Live Now</h3>
            
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-28 w-full bg-muted/20 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : data?.liveNow?.length === 0 ? (
              <EmptyState
                icon={Video}
                title="No streams are currently live"
                description="Live streams will appear here when they are actively broadcasting."
                compact
                className="border-0 shadow-none bg-card/50"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data?.liveNow?.map((stream) => (
                  <div key={stream.id} className="p-5 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-rose-500/10 transition-colors" />
                    
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-lg leading-none truncate pr-2 max-w-[200px] sm:max-w-[250px]">{stream.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1.5">{stream.workspace.name}</p>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-600 rounded-full text-xs font-bold border border-rose-500/20 shrink-0 shadow-sm shadow-rose-500/10 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        LIVE
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-4 text-muted-foreground">
                      {stream.platforms.map((p) => (
                        <div key={p} className="flex items-center justify-center w-8 h-8 rounded-md bg-accent text-foreground/70" title={p}>
                          <PlatformIcon platform={p} className="w-4 h-4" />
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t text-xs text-muted-foreground font-medium flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5" />
                      Started {formatRelativeTime(stream.startedAt, {}, 'recently')} ago
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
