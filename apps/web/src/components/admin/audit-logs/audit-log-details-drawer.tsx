'use client';

import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { useAuditLogDetails } from '@/hooks/use-audit';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Server, Monitor, MapPin, Hash, Key } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface AuditLogDetailsDrawerProps {
  logId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditLogDetailsDrawer({ logId, open, onOpenChange }: AuditLogDetailsDrawerProps) {
  const { data: log, isLoading, isError } = useAuditLogDetails(logId);

  // Safely stringify metadata with pretty printing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderMetadata = (metadata?: Record<string, any>) => {
    if (!metadata) return null;

    // We expect the backend to have already sanitized SENSITIVE_KEYS.
    // As a secondary frontend defense, we just render the raw sanitized json nicely.
    try {
      const formatted = JSON.stringify(metadata, null, 2);
      return (
        <pre className="p-4 rounded-md bg-muted/50 text-xs font-mono overflow-x-auto text-muted-foreground">
          {formatted}
        </pre>
      );
    } catch (e) {
      return <div className="text-destructive text-sm">Failed to render metadata.</div>;
    }
  };

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Audit Log Details
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Security and administrative activity history
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        ) : isError || !log ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <ShieldAlert className="h-8 w-8 mb-2 text-destructive" />
            <p>Failed to load details or log not found.</p>
          </div>
        ) : (
          <div className="h-full pr-4 overflow-y-auto">
            <div className="space-y-6 pb-20">

              {/* Header Info */}
              <div className="bg-muted/30 p-4 rounded-lg border flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Hash className="h-4 w-4" /> Log ID
                  </span>
                  <span className="font-mono text-xs">{log.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Monitor className="h-4 w-4" /> Action
                  </span>
                  <Badge variant="outline" className="font-mono">{formatAction(log.action)}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Server className="h-4 w-4" /> Module
                  </span>
                  <span className="font-medium text-sm">{log.module}</span>
                </div>
              </div>

              {/* Admin Details */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold tracking-tight">Administrator</h4>
                <Separator />
                {log.adminUser ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Name</p>
                      <p className="text-sm font-medium">{log.adminUser.firstName} {log.adminUser.lastName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Email</p>
                      <p className="text-sm font-medium">{log.adminUser.email}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Admin ID</p>
                      <p className="text-xs font-mono text-muted-foreground">{log.adminUser.id}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm italic text-muted-foreground">System / Unknown Admin</p>
                )}
              </div>

              {/* Target Details */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold tracking-tight">Target</h4>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Type</p>
                    <p className="text-sm font-medium">{log.targetType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Name</p>
                    <p className="text-sm font-medium">{log.targetName || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Target ID</p>
                    <p className="text-xs font-mono text-muted-foreground">{log.targetId || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Request Details */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold tracking-tight">Request Info</h4>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs font-medium">IP Address</p>
                      <p className="text-xs font-mono text-muted-foreground">{log.ipAddress || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Monitor className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs font-medium">User Agent</p>
                      <p className="text-xs text-muted-foreground break-all">{log.userAgent || 'N/A'}</p>
                    </div>
                  </div>
                  {log.requestId && (
                    <div className="flex items-start gap-4">
                      <Key className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs font-medium">Request ID</p>
                        <p className="text-xs font-mono text-muted-foreground">{log.requestId}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className="h-4 w-4 text-muted-foreground mt-0.5 flex justify-center items-center font-bold text-[10px]">DT</div>
                    <div>
                      <p className="text-xs font-medium">Timestamp (UTC)</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.createdAt), 'PPpp')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold tracking-tight">Metadata payload</h4>
                <Separator />
                {log.metadata && Object.keys(log.metadata).length > 0 ? (
                  renderMetadata(log.metadata)
                ) : (
                  <p className="text-sm italic text-muted-foreground">No metadata attached to this event.</p>
                )}
              </div>

            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
