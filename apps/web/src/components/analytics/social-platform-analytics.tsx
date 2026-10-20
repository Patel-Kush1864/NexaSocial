'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { DashboardKpiCard } from '@/components/dashboard/dashboard-kpi-card';
import { DashboardChartSkeleton } from '@/components/dashboard/skeletons/dashboard-chart-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { HorizontalBarChart } from './horizontal-bar-chart';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Share2 } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlatformStatus } from '@/types/analytics';

const getStatusBadge = (status: PlatformStatus) => {
  switch (status) {
    case 'OPERATIONAL':
      return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">● Operational</Badge>;
    case 'DEGRADED':
      return <Badge variant="outline" className="text-amber-500 border-amber-500">● Degraded</Badge>;
    case 'MAJOR_ISSUES':
      return <Badge variant="destructive">● Major Issues</Badge>;
    case 'UNAVAILABLE':
      return <Badge variant="secondary" className="text-muted-foreground">● Unavailable</Badge>;
    default:
      return <Badge variant="outline">● Unknown</Badge>;
  }
};

export function SocialPlatformAnalytics() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['social-platform-analytics'],
    queryFn: () => dashboardService.getSocialPlatformAnalytics(),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Social Platform Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor platform integrations, connections, and health.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isError ? (
        <ErrorState
          title="Error"
          message="Unable to load social platform data."
          onRetry={() => refetch()}
          className="my-12"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table Section */}
          <div className="lg:col-span-2 rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="p-6 pb-2">
              <h3 className="font-semibold leading-none tracking-tight">Platform Integrations</h3>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Platform</TableHead>
                    <TableHead className="text-right">Accounts</TableHead>
                    <TableHead className="text-right">Active</TableHead>
                    <TableHead className="text-right">Errors</TableHead>
                    <TableHead>Last Sync</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 7 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><div className="h-4 bg-muted/50 rounded animate-pulse w-24"></div></TableCell>
                        <TableCell><div className="h-4 bg-muted/50 rounded animate-pulse w-12 ml-auto"></div></TableCell>
                        <TableCell><div className="h-4 bg-muted/50 rounded animate-pulse w-12 ml-auto"></div></TableCell>
                        <TableCell><div className="h-4 bg-muted/50 rounded animate-pulse w-12 ml-auto"></div></TableCell>
                        <TableCell><div className="h-4 bg-muted/50 rounded animate-pulse w-20"></div></TableCell>
                        <TableCell><div className="h-6 bg-muted/50 rounded-full animate-pulse w-24"></div></TableCell>
                      </TableRow>
                    ))
                  ) : !data?.platforms || data.platforms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No social accounts have been connected yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.platforms.map((platform) => (
                      <TableRow key={platform.platform}>
                        <TableCell className="font-medium">{platform.displayName}</TableCell>
                        <TableCell className="text-right">{formatNumber(platform.connectedAccounts)}</TableCell>
                        <TableCell className="text-right">{formatNumber(platform.activeConnections)}</TableCell>
                        <TableCell className="text-right text-red-500 font-medium">
                          {platform.connectionErrors > 0 ? formatNumber(platform.connectionErrors) : '0'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {platform.lastSyncAt ? new Date(platform.lastSyncAt).toLocaleString() : 'Never'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(platform.status)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Usage Chart Section */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h3 className="font-semibold leading-none tracking-tight mb-6">Social Platform Usage</h3>
              
              {isLoading ? (
                <DashboardChartSkeleton />
              ) : !data?.usage || data.usage.length === 0 ? (
                <EmptyState
                  icon={Share2}
                  title="No social platform data available"
                  description="Platform connection statistics will appear here when social accounts are connected."
                  compact
                  className="border-0 bg-transparent shadow-none"
                />
              ) : (
                <HorizontalBarChart 
                  data={data.usage.map(u => ({
                    name: data.platforms.find(p => p.platform === u.platform)?.displayName || u.platform,
                    value: u.connectedAccounts
                  }))} 
                  xKey="value" 
                  yKey="name" 
                  tooltipLabel="Connected Accounts" 
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
