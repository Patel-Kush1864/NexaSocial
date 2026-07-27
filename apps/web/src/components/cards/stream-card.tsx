'use client';

import Link from 'next/link';
import type { LiveStream } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, Calendar, Users, Play, Trash2, ArrowRight } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface StreamCardProps {
  stream: LiveStream;
  onDelete?: (id: string) => void;
}

export function StreamCard({ stream, onDelete }: StreamCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE':
        return (
          <Badge className="bg-rose-600 text-white font-bold animate-pulse text-[10px]">
            <Radio className="w-3 h-3 mr-1" />
            LIVE NOW
          </Badge>
        );
      case 'SCHEDULED':
        return (
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
            <Calendar className="w-3 h-3 mr-1" />
            Scheduled
          </Badge>
        );
      case 'ENDED':
        return <Badge variant="secondary" className="text-[10px]">Ended</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <Card className="glass-panel border-border/50 shadow-md relative overflow-hidden group hover:border-primary/40 transition-all">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          {getStatusBadge(stream.status)}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(stream.id)}
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        <div className="space-y-1">
          <h4 className="text-base font-bold leading-tight group-hover:text-primary transition-colors">
            {stream.title}
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {stream.description || 'No description provided for this stream session.'}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/30">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-violet-400" />
            <span>{(stream.viewerCount || 0).toLocaleString()} viewers</span>
          </div>

          <div className="text-[11px]">
            {stream.scheduledAt
              ? format(new Date(stream.scheduledAt), 'MMM dd, hh:mm a')
              : stream.startedAt
              ? `Started ${formatDistanceToNow(new Date(stream.startedAt), { addSuffix: true })}`
              : 'Draft'}
          </div>
        </div>

        <div className="pt-1">
          <Button
            asChild
            size="sm"
            className="w-full h-9 text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-500/20"
          >
            <Link href={`/streams/${stream.id}`}>
              {stream.status === 'LIVE' ? (
                <>
                  <Radio className="w-3.5 h-3.5 mr-2 text-white animate-ping" />
                  Enter Studio
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
      </CardContent>
    </Card>
  );
}
