'use client';

import { useSystemHealth, useRefreshSystemHealth } from '@/hooks/use-system-health';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { OverallStatusCard } from './overall-status-card';
import { ServiceHealthGrid } from './service-health-grid';
import { QueueMonitoringCard } from './queue-monitoring-card';
import { RuntimeMetricsCard } from './runtime-metrics-card';
import { DatabaseMetricsCard } from './database-metrics-card';
import { StorageMetricsCard } from './storage-metrics-card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FailedJobsTable } from './failed-jobs-table';
import { DashboardHealthSkeleton } from '@/components/dashboard/skeletons/dashboard-health-skeleton';
import { ErrorState } from '@/components/shared/error-state';

export function SystemHealthClient() {
  const { data, isLoading, error, isRefetching } = useSystemHealth();
  const { mutate: refresh, isPending: isRefreshing } = useRefreshSystemHealth();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <DashboardHealthSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Error"
        message="Unable to load system health information."
        onRetry={() => refresh()}
        className="my-12"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Monitor NexaSocial infrastructure, services, queues, and runtime performance.
        </p>
        <Button
          variant="outline"
          onClick={() => refresh()}
          disabled={isRefreshing || isRefetching}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing || isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <OverallStatusCard data={data} />

      <ServiceHealthGrid services={data.services} />

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue">Queue & Jobs</TabsTrigger>
          <TabsTrigger value="runtime">Runtime & DB</TabsTrigger>
        </TabsList>
        <TabsContent value="queue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <QueueMonitoringCard queue={data.queue} />
            <div className="rounded-xl border bg-card text-card-foreground shadow">
              <div className="p-6">
                <h3 className="font-semibold leading-none tracking-tight mb-4">Failed Jobs</h3>
                <FailedJobsTable />
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="runtime" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <RuntimeMetricsCard runtime={data.runtime} />
            <DatabaseMetricsCard database={data.database} />
            <StorageMetricsCard storage={data.storage} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
