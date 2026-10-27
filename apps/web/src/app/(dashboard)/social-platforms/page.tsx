'use client';

import { useSocialPlatforms } from '@/hooks/use-admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, ServerCrash, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SocialPlatformCard } from './components/social-platform-card';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';

export default function SocialPlatformsPage() {
  const { data, isLoading, error } = useSocialPlatforms();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'social-platforms'] });
  };

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center space-y-4">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="text-lg font-semibold">Unable to load social platforms</h2>
          <Button variant="outline" onClick={handleRefresh}>Retry</Button>
        </div>
      </div>
    );
  }

  const platforms = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
      ? data
      : [];

  const total = platforms.length;
  const enabled = platforms.filter(
    (p: any) => p.enabled ?? p.isEnabled ?? false,
  ).length;
  const disabled = platforms.filter(
    (p: any) => !(p.enabled ?? p.isEnabled ?? false),
  ).length;
  const healthy = platforms.filter(
    (p: any) => (p.health || p.status) === 'HEALTHY',
  ).length;
  const degraded = platforms.filter(
    (p: any) => (p.health || p.status) === 'DEGRADED',
  ).length;
  const down = platforms.filter(
    (p: any) => (p.health || p.status) === 'DOWN',
  ).length;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Social Platforms</h2>
          <p className="text-muted-foreground">
            Manage and monitor social platform integrations across NexaSocial.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{total}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enabled</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{enabled}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disabled</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{disabled}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{healthy}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Degraded</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{degraded}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Down</CardTitle>
            <ServerCrash className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{down}</div>}
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : platforms.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed">
          <div className="text-center text-muted-foreground">
            <p>No social platforms configured</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {platforms.map((platform: any) => (
            <SocialPlatformCard key={platform.id} platform={platform} />
          ))}
        </div>
      )}
    </div>
  );
}
