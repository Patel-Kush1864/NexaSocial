'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { UserGrowthChart } from './user-growth-chart';
import { UserAnalyticsRange } from '@/types/analytics';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Activity, UserX, AlertCircle } from 'lucide-react';
import { DashboardKpiCard } from '@/components/dashboard/dashboard-kpi-card';
import { DashboardChartSkeleton } from '@/components/dashboard/skeletons/dashboard-chart-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { formatNumber } from '@/lib/utils';

const RANGES: { label: string; value: UserAnalyticsRange }[] = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '3 Months', value: '3m' },
  { label: '6 Months', value: '6m' },
  { label: '1 Year', value: '1y' },
];

export function UserAnalytics() {
  const [range, setRange] = useState<UserAnalyticsRange>('30d');

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['user-analytics', range],
    queryFn: () => dashboardService.getUserAnalytics(range),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">User Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor user growth, engagement, and account status across NexaSocial.
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
          message="Unable to load user analytics."
          onRetry={() => refetch()}
          className="my-12"
        />
      ) : (
        <>
          {/* User Growth Chart */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm min-w-0">
            <div className="p-6">
              <h3 className="font-semibold leading-none tracking-tight mb-6">User Growth</h3>
              
              {isLoading ? (
                <DashboardChartSkeleton />
              ) : !data?.growth || data.growth.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No user analytics available"
                  description="User activity data will appear here once the platform has enough recorded activity."
                  compact
                  className="border-0 bg-transparent shadow-none"
                />
              ) : (
                <UserGrowthChart data={data.growth} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
