'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { TimeSeriesChart } from './time-series-chart';
import { SubscriptionAnalyticsRange } from '@/types/analytics';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, AlertCircle, XCircle, Ban } from 'lucide-react';
import { DashboardKpiCard } from '@/components/dashboard/dashboard-kpi-card';
import { DashboardChartSkeleton } from '@/components/dashboard/skeletons/dashboard-chart-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';

const RANGES: { label: string; value: SubscriptionAnalyticsRange }[] = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '3 Months', value: '3m' },
  { label: '6 Months', value: '6m' },
  { label: '1 Year', value: '1y' },
];

export function SubscriptionAnalytics() {
  const [range, setRange] = useState<SubscriptionAnalyticsRange>('30d');

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['subscription-analytics', range],
    queryFn: () => dashboardService.getSubscriptionAnalytics(range),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Subscription Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor subscription lifecycle and growth across NexaSocial.
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
          message="Unable to load subscription analytics."
          onRetry={() => refetch()}
          className="my-12"
        />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            <DashboardKpiCard
              title="Active"
              value={(data?.summary.active || 0).toLocaleString()}
              icon={CheckCircle2}
              gradient="from-emerald-500 to-teal-600"
              isLoading={isLoading}
            />
            <DashboardKpiCard
              title="Trialing"
              value={(data?.summary.trialing || 0).toLocaleString()}
              icon={Clock}
              gradient="from-blue-500 to-indigo-600"
              isLoading={isLoading}
            />
            <DashboardKpiCard
              title="Past Due"
              value={(data?.summary.pastDue || 0).toLocaleString()}
              icon={AlertCircle}
              gradient="from-amber-500 to-orange-600"
              isLoading={isLoading}
            />
            <DashboardKpiCard
              title="Cancelled"
              value={(data?.summary.cancelled || 0).toLocaleString()}
              icon={XCircle}
              gradient="from-rose-500 to-red-600"
              isLoading={isLoading}
            />
            <DashboardKpiCard
              title="Expired"
              value={(data?.summary.expired || 0).toLocaleString()}
              icon={Ban}
              gradient="from-slate-500 to-gray-600"
              isLoading={isLoading}
            />
          </div>

          {/* Subscription Growth Chart */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h3 className="font-semibold leading-none tracking-tight mb-6">Subscription Growth</h3>
              
              {isLoading ? (
                <DashboardChartSkeleton />
              ) : !data?.growth || data.growth.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="No subscription data available"
                  description="Subscription analytics will appear here once subscriptions are created."
                  compact
                  className="border-0 bg-transparent shadow-none"
                />
              ) : (
                <TimeSeriesChart 
                  data={data.growth} 
                  xKey="date" 
                  yKey="subscriptions" 
                  tooltipLabel="Subscriptions" 
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
