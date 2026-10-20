'use client';

import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { useSocialPlatformHealth, useSocialPlatformStatistics, useSocialPlatformErrors, useToggleSocialPlatform } from '@/hooks/use-admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, Clock, Power, ServerCrash, RefreshCw } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';

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
  const { data: healthData, isLoading: isHealthLoading, isRefetching: isHealthRefetching, refetch: refetchHealth } = useSocialPlatformHealth(platform.id);
  const { data: statsData, isLoading: isStatsLoading } = useSocialPlatformStatistics(platform.id);
  const { data: errorsData, isLoading: isErrorsLoading } = useSocialPlatformErrors(platform.id);
  const toggleMutation = useToggleSocialPlatform();
  const queryClient = useQueryClient();

  const handleToggle = async () => {
    await toggleMutation.mutateAsync({ id: platform.id, enabled: !platform.enabled });
  };

  const health = healthData?.status || platform.health;
  
  const getHealthIcon = () => {
    switch (health) {
      case 'HEALTHY':
        return <CheckCircle2 className="mr-1 h-4 w-4 text-emerald-500" />;
      case 'DEGRADED':
        return <AlertCircle className="mr-1 h-4 w-4 text-amber-500" />;
      case 'DOWN':
        return <ServerCrash className="mr-1 h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="mr-1 h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{platform.name}</h2>
            <Badge variant={platform.enabled ? 'default' : 'secondary'} className={platform.enabled ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
              {platform.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Platform Key: <code className="bg-muted px-1 py-0.5 rounded">{platform.key}</code>
          </p>
        </div>

        <div className="mt-8 space-y-8">
          {/* ACTIONS */}
          <div className="flex space-x-2">
            <Button
              variant={platform.enabled ? 'destructive' : 'default'}
              className="flex-1"
              disabled={toggleMutation.isPending}
              onClick={handleToggle}
            >
              <Power className="mr-2 h-4 w-4" />
              {toggleMutation.isPending ? 'Updating...' : platform.enabled ? 'Disable Platform' : 'Enable Platform'}
            </Button>
            <Button variant="outline" onClick={() => {
              refetchHealth();
              queryClient.invalidateQueries({ queryKey: ['admin', 'social-platforms', platform.id] });
            }} disabled={isHealthRefetching}>
              <RefreshCw className={`h-4 w-4 ${isHealthRefetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <Separator />

          {/* HEALTH */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold tracking-tight">Health</h3>
            {isHealthLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Current Status</span>
                  <div className="flex items-center text-lg font-semibold">
                    {getHealthIcon()}
                    {health}
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Response Time</span>
                  <span className="text-lg font-semibold">{healthData?.responseTimeMs || 0} ms</span>
                </div>
                <div className="flex flex-col space-y-1 col-span-2 mt-2">
                  <span className="text-xs font-medium text-muted-foreground flex items-center">
                    <Clock className="mr-1 h-3 w-3" /> Last Checked
                  </span>
                  <span className="text-sm">
                    {healthData?.lastCheckedAt ? formatDistanceToNow(new Date(healthData.lastCheckedAt), { addSuffix: true }) : 'Never'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* CONNECTIONS */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold tracking-tight">Connections</h3>
            {isStatsLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Total Accounts</span>
                  <span className="text-2xl font-bold">{statsData?.connections?.total || 0}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Active</span>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{statsData?.connections?.active || 0}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Inactive</span>
                  <span className="text-2xl font-bold text-amber-500">{statsData?.connections?.inactive || 0}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Failed</span>
                  <span className="text-2xl font-bold text-destructive">{statsData?.connections?.failed || 0}</span>
                </div>
              </div>
            )}
          </div>

          {/* API ERRORS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold tracking-tight">Recent API Errors</h3>
              <Badge variant="destructive">{errorsData?.meta?.total || 0} Total</Badge>
            </div>
            {isErrorsLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : errorsData?.data?.length === 0 ? (
              <div className="flex h-24 items-center justify-center rounded-lg border border-dashed">
                <span className="text-sm text-muted-foreground">No recent API errors</span>
              </div>
            ) : (
              <div className="space-y-3">
                {errorsData?.data?.map((error: any) => (
                  <div key={error.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-destructive">{error.statusCode} {error.type}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(error.occurredAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{error.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* PLATFORM INFORMATION */}
          <div className="space-y-4">
             <h3 className="text-lg font-semibold tracking-tight">Platform Information</h3>
             <div className="rounded-lg border p-4 text-sm space-y-2 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Created</span>
                  <span>{platform.createdAt ? format(new Date(platform.createdAt), 'MMM d, yyyy') : 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Updated</span>
                  <span>{platform.updatedAt ? format(new Date(platform.updatedAt), 'MMM d, yyyy') : 'Unknown'}</span>
                </div>
             </div>
          </div>
          
        </div>
      </SheetContent>
    </Sheet>
  );
}
