'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { useAuditLogDetails } from '@/hooks/use-audit';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShieldAlert,
  Server,
  Monitor,
  MapPin,
  Key,
  Copy,
  Check,
  User,
  Mail,
  Calendar,
  Layers,
  FileCode,
  ExternalLink,
  Activity,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface AuditLogDetailsDrawerProps {
  logId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditLogDetailsDrawer({ logId, open, onOpenChange }: AuditLogDetailsDrawerProps) {
  const { data: log, isLoading, isError } = useAuditLogDetails(logId);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldId: string, successMessage = 'Copied to clipboard') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    toast.success(successMessage);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'A';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'A';
  };

  const formatAction = (action?: string) => {
    if (!action) return 'Unknown Action';
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getActionColor = (action?: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('REVOKE')) {
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    }
    if (act.includes('CREATE') || act.includes('ADD') || act.includes('EXPORT')) {
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
    if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('MODIFY')) {
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    }
    return 'bg-primary/15 text-primary border-primary/30';
  };

  const rawDate = log?.createdAt || log?.created_at;
  const isDateValid = rawDate && !isNaN(new Date(rawDate).getTime());
  const formattedDate = isDateValid ? format(new Date(rawDate), 'PPP · hh:mm:ss a') : 'N/A';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg md:max-w-xl bg-background/95 backdrop-blur-2xl border-l border-border/50 p-0 flex flex-col shadow-2xl">
        {/* Sticky Header */}
        <div className="p-5 sm:p-6 border-b border-border/40 bg-card/40 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 pr-10">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent border border-primary/25 flex items-center justify-center text-primary shadow-inner shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Audit Log Details
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Security and administrative activity history
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-40 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : isError || !log ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
              <ShieldAlert className="w-10 h-10 text-destructive/40 mb-2" />
              <p className="text-sm font-medium text-foreground">Log Entry Not Found</p>
              <p className="text-xs text-muted-foreground max-w-[260px]">
                Failed to load details or the requested audit record has been pruned.
              </p>
            </div>
          ) : (
            <div className="space-y-6 pb-2">
              {/* Hero Action Summary Card */}
              <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card/90 via-card/50 to-muted/20 p-5 sm:p-6 shadow-xl backdrop-blur-xl">
                <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-20 bg-primary/20" />

                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-primary" />
                      Security Event
                    </span>
                    <Badge variant="outline" className={`px-2.5 py-0.5 text-xs font-semibold ${getActionColor(log.action)}`}>
                      {log.module || 'SYSTEM'}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                      {formatAction(log.action)}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 font-mono">
                      <span>Action Code:</span>
                      <span className="text-foreground font-semibold">{log.action}</span>
                    </p>
                  </div>

                  {/* Copyable Log UUID */}
                  <div className="pt-1">
                    <button
                      onClick={() => copyToClipboard(log.id, 'logId', 'Log ID copied to clipboard')}
                      type="button"
                      className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-background/70 hover:bg-background border border-border/50 text-xs font-mono text-muted-foreground hover:text-foreground transition-all group"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <Key className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{log.id}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-sans font-medium text-primary shrink-0">
                        {copiedField === 'logId' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
                            <span>Copy ID</span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Administrator Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <User className="w-3.5 h-3.5 text-primary" />
                  Administrator Identity
                </div>

                {log.adminUser ? (
                  <div className="p-4 rounded-xl border border-border/50 bg-card/40 hover:border-border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md ring-2 ring-primary/20 shrink-0">
                        {getInitials(log.adminUser.firstName, log.adminUser.lastName)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {log.adminUser.firstName} {log.adminUser.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate mt-0.5">
                          <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{log.adminUser.email}</span>
                        </p>
                      </div>
                    </div>
                    {log.adminUser.id && (
                      <Link
                        href={`/admin/users/${log.adminUser.id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 hover:border-primary/50 bg-muted/30 hover:bg-primary/10 text-xs font-medium text-primary transition-all shrink-0 self-start sm:self-center"
                      >
                        <span>View Profile</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-border/60 bg-muted/20 text-xs text-muted-foreground flex items-center gap-2">
                    <Server className="w-4 h-4 text-muted-foreground" />
                    <span>Triggered by System / Background Worker</span>
                  </div>
                )}
              </div>

              {/* Target Entity */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  Target Entity
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-border/50 bg-card/40 flex flex-col justify-between">
                    <span className="text-xs text-muted-foreground mb-1">Target Type</span>
                    <div className="font-semibold text-sm text-foreground">
                      {log.targetType ? (
                        <Badge variant="outline" className="text-xs font-mono">
                          {log.targetType}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border/50 bg-card/40 flex flex-col justify-between">
                    <span className="text-xs text-muted-foreground mb-1">Target Name</span>
                    <span className="font-semibold text-sm text-foreground truncate" title={log.targetName || '—'}>
                      {log.targetName || '—'}
                    </span>
                  </div>

                  {log.targetId && (
                    <div className="sm:col-span-2 p-3.5 rounded-xl border border-border/50 bg-card/40 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs text-muted-foreground block">Target ID</span>
                        <span className="font-mono text-xs text-muted-foreground truncate block max-w-[280px] sm:max-w-[360px]" title={log.targetId}>
                          {log.targetId}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(log.targetId!, 'targetId', 'Target ID copied')}
                        className="px-2.5 py-1.5 rounded-lg border border-border/60 hover:bg-muted text-xs font-medium flex items-center gap-1.5 text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                      >
                        {copiedField === 'targetId' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Request Diagnostics */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Globe className="w-3.5 h-3.5 text-primary" />
                  Request Context
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* IP Address */}
                    <div className="p-3.5 rounded-xl border border-border/50 bg-card/40 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" /> IP Address
                        </span>
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {log.ipAddress || '—'}
                        </span>
                      </div>
                      {log.ipAddress && (
                        <button
                          onClick={() => copyToClipboard(log.ipAddress!, 'ip', 'IP address copied')}
                          className="p-1.5 hover:text-primary text-muted-foreground rounded transition-colors"
                          title="Copy IP"
                        >
                          {copiedField === 'ip' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="p-3.5 rounded-xl border border-border/50 bg-card/40 flex flex-col justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" /> Timestamp (UTC)
                      </span>
                      <span className="font-medium text-xs text-foreground truncate">
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  {/* User Agent */}
                  {log.userAgent && (
                    <div className="p-3.5 rounded-xl border border-border/50 bg-card/40 space-y-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Monitor className="w-3.5 h-3.5 text-muted-foreground" /> User Agent
                      </span>
                      <p className="font-mono text-[11px] text-muted-foreground break-all bg-background/60 p-2.5 rounded-lg border border-border/40">
                        {log.userAgent}
                      </p>
                    </div>
                  )}

                  {/* Request ID */}
                  {log.requestId && (
                    <div className="p-3.5 rounded-xl border border-border/50 bg-card/40 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs text-muted-foreground block">Request ID</span>
                        <span className="font-mono text-xs text-muted-foreground truncate block max-w-[280px]" title={log.requestId}>
                          {log.requestId}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(log.requestId!, 'reqId', 'Request ID copied')}
                        className="px-2.5 py-1.5 rounded-lg border border-border/60 hover:bg-muted text-xs font-medium flex items-center gap-1.5 text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                      >
                        {copiedField === 'reqId' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata Payload */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <FileCode className="w-3.5 h-3.5 text-primary" />
                    Metadata Payload
                  </div>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(log.metadata, null, 2), 'meta', 'Metadata copied to clipboard')}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1"
                    >
                      {copiedField === 'meta' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Payload</span>
                    </button>
                  )}
                </div>

                {log.metadata && Object.keys(log.metadata).length > 0 ? (
                  <div className="rounded-xl border border-border/50 bg-card/40 overflow-hidden">
                    <pre className="p-4 text-xs font-mono text-muted-foreground overflow-x-auto leading-relaxed max-h-64 custom-scrollbar">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-border/60 bg-muted/20 text-xs text-muted-foreground text-center">
                    No metadata payload attached to this event.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        {log && (
          <div className="p-4 sm:p-5 border-t border-border/40 bg-card/60 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const summary = JSON.stringify(log, null, 2);
                copyToClipboard(summary, 'full', 'Full audit log JSON copied');
              }}
              className="gap-1.5 text-xs border-border/60 hover:bg-muted"
            >
              {copiedField === 'full' ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span>Copy Full JSON</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs px-5 shadow-sm"
            >
              Done
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
