'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import {
  useSocialPlatformHealth,
  useSocialPlatformStatistics,
  useSocialPlatformErrors,
  useToggleSocialPlatform,
} from '@/hooks/use-admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Power,
  ServerCrash,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Activity,
  Users,
  Radio,
  Zap,
  HelpCircle,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { formatRelativeTime } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface SocialPlatformDetailsDrawerProps {
  platform: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SocialPlatformDetailsDrawer({
  platform,
  open,
  onOpenChange,
}: SocialPlatformDetailsDrawerProps) {
  const [copiedKey, setCopiedKey] = useState(false);

  const platformId = platform?.id || '';
  const {
    data: healthData,
    isLoading: isHealthLoading,
    isRefetching: isHealthRefetching,
    refetch: refetchHealth,
  } = useSocialPlatformHealth(platformId);

  const { data: statsData, isLoading: isStatsLoading } =
    useSocialPlatformStatistics(platformId);

  const { data: errorsData, isLoading: isErrorsLoading } =
    useSocialPlatformErrors(platformId);

  const toggleMutation = useToggleSocialPlatform();
  const queryClient = useQueryClient();

  if (!platform) return null;

  const isEnabled = platform.enabled ?? platform.isEnabled ?? false;
  const platformName = platform.name || platform.platform || 'Platform';
  const platformKey = (platform.key || platform.platform || platform.name || '').toUpperCase();
  const rawHealth = (healthData?.status || platform.health || platform.status || 'UNKNOWN').toUpperCase();

  const handleToggle = async () => {
    try {
      await toggleMutation.mutateAsync({ id: platform.id, enabled: !isEnabled });
    } catch {
      // toast is already handled in mutation
    }
  };

  const handleRefreshDiagnostics = async () => {
    await refetchHealth();
    queryClient.invalidateQueries({
      queryKey: ['admin', 'social-platforms', platform.id],
    });
    toast.success('Platform diagnostics refreshed');
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(platformKey);
    setCopiedKey(true);
    toast.success('Platform key copied to clipboard');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Brand color helper
  const getBrandDetails = () => {
    switch (platformKey) {
      case 'YOUTUBE':
        return {
          textColor: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          label: 'YouTube Live & Video',
        };
      case 'FACEBOOK':
        return {
          textColor: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          label: 'Facebook Pages & Live',
        };
      case 'INSTAGRAM':
        return {
          textColor: 'text-pink-500',
          bgColor: 'bg-pink-500/10',
          borderColor: 'border-pink-500/20',
          label: 'Instagram Graph API',
        };
      case 'X':
      case 'TWITTER':
        return {
          textColor: 'text-sky-400',
          bgColor: 'bg-sky-400/10',
          borderColor: 'border-sky-400/20',
          label: 'X (formerly Twitter)',
        };
      default:
        return {
          textColor: 'text-primary',
          bgColor: 'bg-primary/10',
          borderColor: 'border-primary/20',
          label: 'Social Integration',
        };
    }
  };

  const brand = getBrandDetails();

  // Stats calculations
  const totalConns = statsData?.connections?.total ?? platform.connectedAccounts ?? 0;
  const activeConns = statsData?.connections?.active ?? platform.activeConnections ?? 0;
  const inactiveConns = statsData?.connections?.inactive ?? 0;
  const failedConns = statsData?.connections?.failed ?? platform.apiErrors ?? 0;
  const activeRate = totalConns > 0 ? Math.round((activeConns / totalConns) * 100) : 100;

  const responseTime = healthData?.responseTimeMs ?? 0;
  const lastCheckedText = healthData?.lastCheckedAt
    ? formatRelativeTime(healthData.lastCheckedAt, { addSuffix: true }, 'Just now')
    : 'Recently';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto p-0 flex flex-col glass-panel border-l border-border/60 shadow-2xl"
      >
        {/* TOP HEADER */}
        <div className="p-6 pb-4 border-b border-border/40 pr-14 bg-muted/20">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg border ${brand.bgColor} ${brand.borderColor} ${brand.textColor}`}
            >
              {platformName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                  {platformName}
                </h2>
                <Badge
                  variant="outline"
                  className={
                    isEnabled
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs font-medium'
                      : 'bg-muted text-muted-foreground border-border text-xs'
                  }
                >
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                      isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'
                    }`}
                  />
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span>{brand.label}</span>
                <span>•</span>
                <button
                  onClick={handleCopyKey}
                  className="inline-flex items-center gap-1 font-mono text-[11px] bg-muted/60 hover:bg-muted px-1.5 py-0.5 rounded border border-border/40 transition-colors"
                  title="Copy Platform Key"
                >
                  <span>{platformKey}</span>
                  {copiedKey ? (
                    <Check className="h-2.5 w-2.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-2.5 w-2.5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* QUICK CONTROLS BAR */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3.5 rounded-xl border border-border/50 bg-card/40">
            <Button
              variant={isEnabled ? 'destructive' : 'default'}
              size="sm"
              className="flex-1 gap-2 font-medium h-9"
              disabled={toggleMutation.isPending}
              onClick={handleToggle}
            >
              <Power className="h-4 w-4" />
              {toggleMutation.isPending
                ? 'Updating...'
                : isEnabled
                ? 'Deactivate Platform'
                : 'Activate Platform'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-9 border-border/60 hover:bg-muted/50"
              onClick={handleRefreshDiagnostics}
              disabled={isHealthRefetching}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isHealthRefetching ? 'animate-spin' : ''}`}
              />
              Run Health Check
            </Button>
          </div>

          {/* LIVE HEALTH & STATUS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Integration Health & Latency
              </h3>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Checked {lastCheckedText}
              </span>
            </div>

            {isHealthLoading ? (
              <Skeleton className="h-24 w-full rounded-xl" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border border-border/50 bg-card/30">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-muted-foreground">Operational Status</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {rawHealth === 'HEALTHY' ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-semibold px-2 py-0.5">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Healthy & Connected
                      </Badge>
                    ) : rawHealth === 'DEGRADED' ? (
                      <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-semibold px-2 py-0.5">
                        <AlertCircle className="h-3.5 w-3.5 mr-1" />
                        Degraded Service
                      </Badge>
                    ) : rawHealth === 'DOWN' ? (
                      <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 font-semibold px-2 py-0.5">
                        <ServerCrash className="h-3.5 w-3.5 mr-1" />
                        Service Down
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20 font-semibold px-2 py-0.5">
                        <HelpCircle className="h-3.5 w-3.5 mr-1" />
                        Unconfigured
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-col space-y-1 sm:border-l sm:border-border/40 sm:pl-4">
                  <span className="text-xs text-muted-foreground">API Response Time</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-foreground">
                      {responseTime}
                    </span>
                    <span className="text-xs text-muted-foreground">ms</span>
                    {responseTime > 0 && responseTime < 150 && (
                      <span className="text-[11px] text-emerald-500 font-medium">Optimal</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CONNECTIONS METRICS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Workspace Connections
              </h3>
              <span className="text-xs font-medium text-emerald-500">
                {activeRate}% Active
              </span>
            </div>

            {isStatsLoading ? (
              <Skeleton className="h-28 w-full rounded-xl" />
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-lg border border-border/50 bg-card/20">
                    <span className="text-[11px] text-muted-foreground block">Total Accounts</span>
                    <span className="text-xl font-bold text-foreground mt-0.5 block">
                      {totalConns}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                    <span className="text-[11px] text-emerald-500 font-medium block">Active</span>
                    <span className="text-xl font-bold text-emerald-500 mt-0.5 block">
                      {activeConns}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                    <span className="text-[11px] text-amber-500 font-medium block">Inactive</span>
                    <span className="text-xl font-bold text-amber-500 mt-0.5 block">
                      {inactiveConns}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
                    <span className="text-[11px] text-rose-500 font-medium block">Failed / Errors</span>
                    <span className="text-xl font-bold text-rose-500 mt-0.5 block">
                      {failedConns}
                    </span>
                  </div>
                </div>

                {/* Connection Health Bar */}
                {totalConns > 0 && (
                  <div className="w-full bg-muted/40 rounded-full h-1.5 overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${(activeConns / totalConns) * 100}%` }}
                    />
                    <div
                      className="bg-amber-500 h-full transition-all duration-500"
                      style={{ width: `${(inactiveConns / totalConns) * 100}%` }}
                    />
                    <div
                      className="bg-rose-500 h-full transition-all duration-500"
                      style={{ width: `${(failedConns / totalConns) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator className="border-border/40" />

          {/* RECENT API ERRORS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Recent API Errors & Exceptions
              </h3>
              <Badge
                variant="outline"
                className={
                  (errorsData?.meta?.total || 0) > 0
                    ? 'border-rose-500/20 text-rose-500 bg-rose-500/10 text-xs'
                    : 'border-emerald-500/20 text-emerald-500 bg-emerald-500/10 text-xs'
                }
              >
                {errorsData?.meta?.total || 0} Total
              </Badge>
            </div>

            {isErrorsLoading ? (
              <Skeleton className="h-28 w-full rounded-xl" />
            ) : !errorsData?.data || errorsData.data.length === 0 ? (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-sm text-foreground">
                <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="font-medium text-emerald-500 text-xs">All Systems Nominal</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    No API exceptions, failed tokens, or OAuth authorization errors logged.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {errorsData.data.map((err: any) => (
                  <div
                    key={err.id}
                    className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-rose-500 font-mono">
                        {err.statusCode} {err.type}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {err.occurredAt
                          ? format(new Date(err.occurredAt), 'MMM d, h:mm a')
                          : 'Recent'}
                      </span>
                    </div>
                    <p className="text-muted-foreground font-mono text-[11px] leading-relaxed break-all">
                      {err.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator className="border-border/40" />

          {/* PLATFORM METADATA & SYSTEM INFO */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary" />
              Platform Architecture & Capability
            </h3>
            <div className="rounded-xl border border-border/50 bg-card/20 p-4 text-xs space-y-2.5">
              <div className="flex items-center justify-between py-0.5">
                <span className="text-muted-foreground">Multi-destination Broadcasting</span>
                <span className="font-medium text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Supported
                </span>
              </div>
              <div className="flex items-center justify-between py-0.5 border-t border-border/30 pt-2">
                <span className="text-muted-foreground">Authentication Standard</span>
                <span className="font-mono text-[11px] text-foreground">OAuth 2.0 PKCE / RTMP</span>
              </div>
              <div className="flex items-center justify-between py-0.5 border-t border-border/30 pt-2">
                <span className="text-muted-foreground">Database Record Created</span>
                <span className="text-foreground">
                  {platform.createdAt
                    ? format(new Date(platform.createdAt), 'MMM dd, yyyy HH:mm')
                    : 'System Default'}
                </span>
              </div>
              <div className="flex items-center justify-between py-0.5 border-t border-border/30 pt-2">
                <span className="text-muted-foreground">Last Configuration Update</span>
                <span className="text-foreground">
                  {platform.updatedAt
                    ? format(new Date(platform.updatedAt), 'MMM dd, yyyy HH:mm')
                    : 'Current'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM CLOSE BAR */}
        <div className="p-4 border-t border-border/40 bg-muted/20 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto px-6 border-border/60 hover:bg-muted/50"
          >
            Close Details
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
