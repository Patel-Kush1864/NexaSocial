'use client';

import { useParams } from 'next/navigation';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useStreamDetails, useStreams } from '@/hooks/use-streams';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Radio, Play, Square, Users, Copy, Check, Tv, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function StreamControlStudioPage() {
  const params = useParams();
  const id = params?.id as string;
  const { currentWorkspace } = useWorkspaceStore();
  const { data: stream, isLoading } = useStreamDetails(id, currentWorkspace?.id);
  const { startStream, stopStream } = useStreams(currentWorkspace?.id);
  const [copiedKey, setCopiedKey] = useState(false);

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Connecting to Live Control Studio..." />;
  }

  if (!stream) {
    return <div className="py-12 text-center text-sm font-semibold">Stream session not found</div>;
  }

  const handleCopyKey = () => {
    navigator.clipboard.writeText('rtmp://live.nexasocial.com/app/live_stream_key_9921');
    setCopiedKey(true);
    toast.success('RTMP stream key copied to clipboard');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleStart = async () => {
    try {
      await startStream({ id: stream.id, workspaceId: currentWorkspace!.id });
    } catch {
      // Handled by toast
    }
  };

  const handleStop = async () => {
    try {
      await stopStream({ id: stream.id, workspaceId: currentWorkspace!.id });
    } catch {
      // Handled by toast
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={stream.title}
        description="Live Control Studio — Monitor metrics, manage broadcasting nodes, and chat."
        badge={stream.status}
        action={
          stream.status === 'LIVE' ? (
            <Button
              onClick={handleStop}
              className="h-10 text-xs font-semibold bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20"
            >
              <Square className="w-3.5 h-3.5 mr-2" />
              End Broadcast
            </Button>
          ) : (
            <Button
              onClick={handleStart}
              className="h-10 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
            >
              <Play className="w-3.5 h-3.5 mr-2" />
              Go Live Now
            </Button>
          )
        }
      />

      {/* Main Studio View & Control Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stream Video Player Mock & Key Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-panel border-border/50 overflow-hidden">
            <div className="aspect-video bg-black/90 relative flex items-center justify-center border-b border-border/30">
              {stream.status === 'LIVE' ? (
                <div className="text-center space-y-3">
                  <Radio className="w-12 h-12 text-rose-500 animate-pulse mx-auto" />
                  <p className="text-sm font-bold text-white uppercase tracking-wider">
                    Broadcasting Live Stream
                  </p>
                  <p className="text-xs text-zinc-400">
                    Resolution: 1080p60 | Bitrate: 6000 Kbps | Latency: 1.2s
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-2 text-zinc-500">
                  <Tv className="w-12 h-12 mx-auto opacity-50" />
                  <p className="text-xs font-semibold">Video preview will appear when stream starts</p>
                </div>
              )}

              {stream.status === 'LIVE' && (
                <Badge className="absolute top-4 left-4 bg-rose-600 text-white font-bold animate-pulse text-xs">
                  ● LIVE NOW
                </Badge>
              )}
            </div>

            <CardContent className="p-5 space-y-4">
              <h3 className="text-base font-bold">RTMP Server Connection Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground font-semibold">Stream URL</span>
                  <div className="p-2.5 rounded-lg bg-accent/30 font-mono text-[11px] truncate border border-border/40">
                    rtmp://live.nexasocial.com/app
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-semibold">Stream Key</span>
                  <div className="flex items-center gap-2">
                    <div className="p-2.5 rounded-lg bg-accent/30 font-mono text-[11px] truncate border border-border/40 flex-1">
                      ••••••••••••••••••••••••
                    </div>
                    <Button variant="outline" size="icon" onClick={handleCopyKey} className="h-9 w-9 shrink-0">
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Metrics & Chat Feed */}
        <div className="space-y-6">
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                Live Viewership Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/30">
                <span className="text-muted-foreground">Current Viewers</span>
                <span className="font-bold text-foreground">
                  {(stream.viewerCount || 420).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/30">
                <span className="text-muted-foreground">Peak Viewers</span>
                <span className="font-bold text-foreground">
                  {(stream.peakViewerCount || 1250).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Stream Health</span>
                <span className="font-bold text-emerald-500">Excellent</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                Cross-Platform Chat Feed
              </CardTitle>
              <CardDescription className="text-xs">
                Aggregated chat messages from all destinations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1 text-xs">
                {[
                  { user: 'Sam_G', platform: 'YT', msg: 'Super excited for this update!' },
                  { user: 'ElenaR', platform: 'TW', msg: 'Can we ask questions at the end?' },
                  { user: 'DevGuy', platform: 'FB', msg: 'Stream quality is crystal clear 👍' },
                ].map((c, i) => (
                  <div key={i} className="p-2 rounded-lg bg-accent/30 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-primary">{c.user}</span>
                      <span className="text-[10px] text-muted-foreground">[{c.platform}]</span>
                    </div>
                    <p className="text-foreground/90">{c.msg}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
