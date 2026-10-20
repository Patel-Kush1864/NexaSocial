'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { TimeSeriesChart } from './time-series-chart';
import { WorkspaceAnalyticsRange } from '@/types/analytics';
import { Button } from '@/components/ui/button';
import { Building2, Building, Activity, AlertOctagon, AlertCircle } from 'lucide-react';
import { DashboardKpiCard } from '@/components/dashboard/dashboard-kpi-card';
import { DashboardChartSkeleton } from '@/components/dashboard/skeletons/dashboard-chart-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';

const RANGES: { label: string; value: WorkspaceAnalyticsRange }[] = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '3 Months', value: '3m' },
  { label: '6 Months', value: '6m' },
  { label: '1 Year', value: '1y' },
];

export function WorkspaceAnalytics() {
  const [range, setRange] = useState<WorkspaceAnalyticsRange>('30d');

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['workspace-analytics', range],
    queryFn: () => dashboardService.getWorkspaceAnalytics(range),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Workspace Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor workspace growth, status, and platform-wide workspace activity across NexaSocial.
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 bg-muted/50 p-1 rounded-lg">
          {RANGES.map((r) => (
            <Button
              key={r.value}
              variant={range === r.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setRange(r.value)}
              className={range === r.value ? 'shadow-sm' : ''}
              disabled={isFetching && range !== r.value}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {isError ? (
        <ErrorState
          title="Error"
          message="Unable to load workspace analytics."
          onRetry={() => refetch()}
          className="my-12"
        />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <DashboardKpiCard
              title="Total Workspaces"
              value={(data?.summary.totalWorkspaces || 0).toLocaleString()}
              icon={Building2}
              gradient="from-blue-600 to-cyan-600"
              isLoading={isLoading}
            />
            <DashboardKpiCard
              title="Active Workspaces"
              value={(data?.summary.activeWorkspaces || 0).toLocaleString()}
              icon={Activity}
              gradient="from-emerald-500 to-teal-600"
              isLoading={isLoading}
            />
            <DashboardKpiCard
              title="Suspended Workspaces"
              value={(data?.summary.suspendedWorkspaces || 0).toLocaleString()}
              icon={AlertOctagon}
              gradient="from-rose-500 to-red-600"
              isLoading={isLoading}
            />
            <DashboardKpiCard
              title="New Workspaces"
              value={(data?.summary.newWorkspaces || 0).toLocaleString()}
              icon={Building}
              gradient="from-violet-600 to-indigo-600"
              isLoading={isLoading}
            />
          </div>

          {/* Workspace Growth Chart */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h3 className="font-semibold leading-none tracking-tight mb-6">Workspace Growth</h3>
              
              {isLoading ? (
                <DashboardChartSkeleton />
              ) : !data?.growth || data.growth.length === 0 ? (
                <EmptyState
                  icon={Building}
                  title="No workspace analytics available"
                  description="Workspace activity will appear here once workspaces begin generating activity."
                  compact
                  className="border-0 bg-transparent shadow-none"
                />
              ) : (
                <TimeSeriesChart 
                  data={data.growth} 
                  xKey="date" 
                  yKey="workspaces" 
                  tooltipLabel="Total Workspaces" 
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
