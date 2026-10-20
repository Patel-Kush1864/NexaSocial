'use client';

import { format } from 'date-fns';
import { SecurityEvent } from '@/hooks/use-security';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldAlert, X } from 'lucide-react';

interface Props {
  event: SecurityEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SecurityEventDetailsDrawer({ event, open, onOpenChange }: Props) {
  if (!open || !event) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      case 'HIGH': return 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20';
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case 'LOW': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" 
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[600px] border-l bg-background shadow-2xl transition-transform duration-300 ease-in-out transform">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold tracking-tight">Security Event Details</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Event</h3>
                  <div className="text-xl font-bold font-mono">{event.event}</div>
                </div>
                <Badge className={getSeverityColor(event.severity)} variant="outline">
                  {event.severity}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Date & Time</div>
                  <div className="font-medium">{format(new Date(event.createdAt), 'dd MMM yyyy, hh:mm:ss a')}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">IP Address</div>
                  <div className="font-medium font-mono">{event.ipAddress || 'Unknown IP'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">User Email</div>
                  <div className="font-medium">{event.userEmail || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">User Agent</div>
                  <div className="text-sm text-muted-foreground truncate">{event.userAgent || '-'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Raw Metadata (Sanitized)</div>
                {event.metadata ? (
                  <pre className="p-4 rounded-xl bg-card border text-xs overflow-auto max-h-[300px]">
                    <code>{JSON.stringify(event.metadata, null, 2)}</code>
                  </pre>
                ) : (
                  <div className="p-4 rounded-xl bg-muted/30 border text-sm text-muted-foreground italic">
                    No additional metadata recorded.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
