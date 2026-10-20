'use client';

import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format, formatDistance } from 'date-fns';
import { useLiveStreamErrors } from '@/hooks/use-admin';
import { AlertCircle, Calendar, Clock, MonitorPlay, User, AlertTriangle } from 'lucide-react';

interface LiveStreamDetailsDrawerProps {
  stream: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LiveStreamDetailsDrawer({
  stream,
  isOpen,
  onClose,
}: LiveStreamDetailsDrawerProps) {
  const { data: errorsData, isLoading: isLoadingErrors } = useLiveStreamErrors(
    stream?.id || '',
    { limit: 5 }
  );

  if (!stream) return null;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'LIVE':
        return 'destructive';
      case 'SCHEDULED':
        return 'default';
      case 'ENDED':
        return 'secondary';
      case 'FAILED':
        return 'destructive';
      case 'CANCELLED':
        return 'outline';
      case 'DRAFT':
        return 'outline';
      default:
        return 'default';
    }
  };

  const duration = () => {
    if (stream.status === 'LIVE' && stream.startedAt) {
      return formatDistance(new Date(), new Date(stream.startedAt));
    }
    if (stream.status === 'ENDED' && stream.startedAt && stream.endedAt) {
      return formatDistance(new Date(stream.endedAt), new Date(stream.startedAt));
    }
    return null;
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col gap-0 p-0">
        <div className="p-6 pb-4">
          <div className="flex flex-col space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-between mb-2">
              <Badge variant={getStatusBadgeVariant(stream.status)}>
                {stream.status}
              </Badge>
              {stream.visibility && (
                <Badge variant="outline" className="text-xs">
                  {stream.visibility}
                </Badge>
              )}
            </div>
            <h2 className="text-xl font-semibold">{stream.title}</h2>
            <p className="text-xs mt-1 text-muted-foreground font-mono break-all">
              ID: {stream.id}
            </p>
          </div>
        </div>

        <div className="flex-1 px-6 overflow-y-auto">
          <div className="space-y-6 pb-6">
            
            {/* Platforms */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <MonitorPlay className="h-4 w-4 text-muted-foreground" />
                Platforms
              </h4>
              <div className="grid gap-2">
                {stream.platformDetails && stream.platformDetails.length > 0 ? (
                  stream.platformDetails.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{p.platformName}</span>
                      </div>
                      <Badge variant={p.status === 'FAILED' ? 'destructive' : 'secondary'} className="text-xs">
                        {p.status || 'PENDING'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No platforms configured.</div>
                )}
              </div>
            </div>

            <Separator />

            {/* Schedule & Timing */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Schedule & Timing
              </h4>
              <div className="grid gap-2 text-sm">
                {stream.scheduledAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scheduled For:</span>
                    <span className="font-medium">{format(new Date(stream.scheduledAt), 'PPp')}</span>
                  </div>
                )}
                {stream.startedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Started At:</span>
                    <span className="font-medium">{format(new Date(stream.startedAt), 'PPp')}</span>
                  </div>
                )}
                {stream.endedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ended At:</span>
                    <span className="font-medium">{format(new Date(stream.endedAt), 'PPp')}</span>
                  </div>
                )}
                {duration() && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{duration()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created At:</span>
                  <span>{format(new Date(stream.createdAt), 'PPp')}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Workspace & Creator */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Workspace & Creator
              </h4>
              <div className="grid gap-2 text-sm bg-muted/30 p-3 rounded-md">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Workspace:</span>
                  <span className="font-medium">{stream.workspace?.name || 'Unknown'}</span>
                </div>
                {stream.workspace?.id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Workspace ID:</span>
                    <span className="font-mono text-xs">{stream.workspace.id}</span>
                  </div>
                )}
                <div className="flex justify-between mt-2 pt-2 border-t">
                  <span className="text-muted-foreground">Creator:</span>
                  <span className="font-medium">{stream.creator?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creator Email:</span>
                  <span>{stream.creator?.email || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Error History */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Recent Errors
              </h4>
              <div className="grid gap-2">
                {isLoadingErrors ? (
                  <div className="text-sm text-muted-foreground">Loading errors...</div>
                ) : errorsData?.data?.length > 0 ? (
                  errorsData.data.map((err: any) => (
                    <div key={err.id} className="border border-destructive/20 bg-destructive/10 rounded-md p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-destructive mb-1">
                        <AlertCircle className="w-3 h-3" />
                        {err.type} {err.statusCode ? `(${err.statusCode})` : ''}
                      </div>
                      <div className="text-sm text-foreground/80 mb-2 font-mono">
                        {err.message}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(err.occurredAt), 'PPpp')}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No recent errors logged.</div>
                )}
              </div>
            </div>

          </div>
        </div>
        <div className="p-4 border-t mt-auto">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
