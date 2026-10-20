'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { TimeSeriesChart } from './time-series-chart';
import { RevenueAnalyticsRange } from '@/types/analytics';
import { Button } from '@/components/ui/button';
import { IndianRupee, Calendar, CalendarDays, RefreshCw, AlertTriangle, AlertCircle } from 'lucide-react';
import { DashboardKpiCard } from '@/components/dashboard/dashboard-kpi-card';
import { DashboardChartSkeleton } from '@/components/dashboard/skeletons/dashboard-chart-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { formatCurrency, formatCurrencyCompact } from '@/lib/format-currency';
import { formatNumber } from '@/lib/utils';

const RANGES: { label: string; value: RevenueAnalyticsRange }[] = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '3M', value: '3m' },
  { label: '6M', value: '6m' },
  { label: '1Y', value: '1y' },
];

export function RevenueAnalytics() {
  const [range, setRange] = useState<RevenueAnalyticsRange>('30d');

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['revenue-analytics', range],
    queryFn: () => dashboardService.getRevenueAnalytics(range),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Revenue Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track platform revenue, refunds, and failed transactions.
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
          message="Unable to load revenue data."
          onRetry={() => refetch()}
          className="my-12"
        />
      ) : (
        <>
          {/* Revenue Growth Chart */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm min-w-0">
            <div className="p-6">
              <h3 className="font-semibold leading-none tracking-tight mb-6">Revenue Growth</h3>
              
              {isLoading ? (
                <DashboardChartSkeleton />
              ) : !data?.growth || data.growth.length === 0 ? (
                <EmptyState
                  icon={IndianRupee}
                  title="No revenue data available"
                  description="Revenue analytics will appear here when successful payments are recorded."
                  compact
                  className="border-0 bg-transparent shadow-none"
                />
              ) : (
                <TimeSeriesChart 
                  data={data.growth} 
                  xKey="date" 
                  yKey="revenue" 
                  tooltipLabel="Revenue"
                  yAxisTickFormatter={(val: number) => formatCurrencyCompact(val)}
                  tooltipValueFormatter={(val: number) => formatCurrency(val)}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
