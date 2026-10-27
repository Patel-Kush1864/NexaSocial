'use client';

import Link from 'next/link';
import type { LiveStream } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Radio,
  Calendar,
  Users,
  Play,
  Trash2,
  ArrowRight,
  Video,
  Share2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { formatRelativeTime, cn } from '@/lib/utils';

interface StreamCardProps {
  stream: LiveStream;
  onDelete?: (id: string) => void;
}

export function StreamCard({ stream, onDelete }: StreamCardProps) {
  const isLive = stream.status === 'LIVE';
  const isScheduled = stream.status === 'SCHEDULED';
  const isEnded = stream.status === 'ENDED';

  const getStatusBadge = () => {
    switch (stream.status) {
      case 'LIVE':
        return (
          <Badge className="bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-[10px] tracking-wide border-0 shadow-lg shadow-rose-600/30 px-2 py-0.5 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            LIVE NOW
          </Badge>
        );
      case 'SCHEDULED':
        return (
          <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] font-semibold px-2 py-0.5 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Scheduled
          </Badge>
        );
      case 'ENDED':
        return (
          <Badge variant="secondary" className="text-[10px] bg-secondary/60 text-muted-foreground border-border/40 font-medium px-2 py-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Ended
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] border-border/50 text-muted-foreground">
            {stream.status}
          </Badge>
        );
    }
  };

  // Helper to extract platforms safely
  const platforms = stream.platforms || [];

  const getPlatformLabel = (platform: { platform?: string; platformName?: string }) => {
    const raw = (platform.platform || platform.platformName || '').toUpperCase();
    if (raw.includes('YOUTUBE')) return { name: 'YouTube', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
    if (raw.includes('FACEBOOK')) return { name: 'Facebook', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    if (raw.includes('INSTAGRAM')) return { name: 'Instagram', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' };
    if (raw.includes('TWITTER') || raw === 'X') return { name: 'X', color: 'text-slate-300 bg-slate-500/10 border-slate-500/20' };
    return { name: raw || 'RTMP', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' };
  };

  return (
    <Card
      className={cn(
        'glass-panel border-border/50 shadow-md relative overflow-hidden group transition-all duration-300 flex flex-col justify-between',
        isLive
          ? 'border-rose-500/40 shadow-rose-500/10 hover:border-rose-500/70 hover:shadow-rose-500/20 ring-1 ring-rose-500/20'
          : 'hover:border-primary/40 hover:shadow-lg',
      )}
    >
      {/* Subtle glowing ambient gradient for live streams */}
      {isLive && (
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/15 rounded-full blur-2xl pointer-events-none" />
      )}

      <CardContent className="p-4 sm:p-5 space-y-4 flex flex-col h-full justify-between">
        <div>
          {/* Top Status & Delete */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge()}
              {isLive && (
                <span className="text-[11px] text-rose-400 font-semibold animate-pulse flex items-center gap-1">
                  Broadcasting
                </span>
              )}
            </div>

            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(stream.id)}
                title="Delete live stream"
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* Title & Description */}
          <div className="space-y-1.5 mt-3">
            <h4 className="text-base font-bold leading-tight group-hover:text-primary transition-colors line-clamp-1">
              {stream.title}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
              {stream.description || 'No description provided for this broadcast session.'}
            </p>
          </div>

          {/* Destinations / Platforms */}
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            {platforms.length > 0 ? (
              platforms.map((p, idx) => {
                const info = getPlatformLabel(p);
                return (
                  <span
                    key={p.id || idx}
                    className={cn(
                      'text-[10px] font-medium px-2 py-0.5 rounded-md border flex items-center gap-1',
                      info.color,
                    )}
                  >
                    <Share2 className="w-2.5 h-2.5" />
                    {info.name}
                  </span>
                );
              })
            ) : (
              <span className="text-[10px] text-muted-foreground/80 flex items-center gap-1 bg-secondary/40 px-2 py-0.5 rounded border border-border/30">
                <Video className="w-2.5 h-2.5" />
                Custom Ingest Studio
              </span>
            )}
          </div>
        </div>

        {/* Footer info & CTA */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/30">
            <div className="flex items-center gap-1.5">
              <Users
                className={cn(
                  'w-3.5 h-3.5',
                  isLive ? 'text-rose-400 animate-pulse' : 'text-violet-400',
                )}
              />
              <span className={cn('font-medium', isLive && 'text-foreground font-bold')}>
                {(stream.viewerCount || 0).toLocaleString()} viewers
              </span>
            </div>

            <div className="text-[11px] truncate max-w-[50%] text-right font-medium">
              {isScheduled && stream.scheduledAt
                ? (() => {
                    try {
                      const d = new Date(stream.scheduledAt);
                      return isNaN(d.getTime()) ? 'Scheduled' : format(d, 'MMM dd, hh:mm a');
                    } catch {
                      return 'Scheduled';
                    }
                  })()
                : stream.startedAt
                ? `Started ${formatRelativeTime(stream.startedAt, { addSuffix: true })}`
                : 'Session Draft'}
            </div>
          </div>

          <div>
            <Button
              asChild
              size="sm"
              className={cn(
                'w-full h-9 text-xs font-semibold shadow-md transition-all',
                isLive
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-600/20'
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-500/20',
              )}
            >
              <Link href={`/streams/${stream.id}`}>
                {isLive ? (
                  <>
                    <Radio className="w-3.5 h-3.5 mr-2 animate-pulse text-white" />
                    Enter Live Broadcast Studio
                    <ArrowRight className="w-3.5 h-3.5 ml-2" />
                  </>
                ) : isScheduled ? (
                  <>
                    <Calendar className="w-3.5 h-3.5 mr-2" />
                    Open Scheduled Studio
                    <ArrowRight className="w-3.5 h-3.5 ml-2" />
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 mr-2" />
                    View Stream Studio
                    <ArrowRight className="w-3.5 h-3.5 ml-2" />
                  </>
                )}
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
