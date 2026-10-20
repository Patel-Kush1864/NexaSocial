'use client';

import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DashboardKpiSkeleton } from '@/components/dashboard/skeletons/dashboard-kpi-skeleton';

export interface DashboardKpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  direction?: 'up' | 'down' | 'neutral';
  sentiment?: 'positive' | 'negative' | 'neutral';
  description?: string;
  icon: LucideIcon;
  gradient?: string;
  isLoading?: boolean;
}

export function DashboardKpiCard({
  title,
  value,
  change,
  direction,
  sentiment = 'positive',
  description,
  icon: Icon,
  gradient = 'from-blue-500 to-cyan-500',
  isLoading = false,
}: DashboardKpiCardProps) {
  if (isLoading) {
    return <DashboardKpiSkeleton />;
  }

  // Determine colors based on sentiment and direction
  let changeColor = 'text-gray-500 dark:text-gray-400';
  if (sentiment === 'positive') {
    if (direction === 'up') changeColor = 'text-emerald-500 dark:text-emerald-400';
    if (direction === 'down') changeColor = 'text-rose-500 dark:text-rose-400';
  } else if (sentiment === 'negative') {
    // For things like failed payments, 'up' is bad.
    if (direction === 'up') changeColor = 'text-rose-500 dark:text-rose-400';
    if (direction === 'down') changeColor = 'text-emerald-500 dark:text-emerald-400';
  }

  const ChangeIcon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;
  const changePrefix = direction === 'up' ? '+' : direction === 'down' ? '-' : '';
  const changeValue = change !== undefined ? Math.abs(change) : 0;

  return (
    <Card className="overflow-hidden border-none shadow-md relative group bg-white dark:bg-zinc-950 transition-all hover:shadow-lg">
      <div
        className={cn(
          'absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:opacity-20',
          gradient
        )}
      />
      
      <CardContent className="p-6 relative z-10">
        <div className="flex justify-between items-start">
          <div className="space-y-2 min-w-0 flex-1 pr-2">
            <p className="text-sm font-medium text-muted-foreground tracking-tight break-words">{title}</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate" title={value.toString()}>{value}</h2>
            </div>
            {change !== undefined && direction !== undefined ? (
              <div className="flex items-center gap-1.5 mt-1">
                {(!isFinite(changeValue) || isNaN(changeValue)) ? (
                  <span className="text-xs text-muted-foreground">No comparison data</span>
                ) : direction === 'neutral' ? (
                  <span className="text-xs text-muted-foreground">No change vs last month</span>
                ) : (
                  <>
                    <div className={cn("flex items-center text-sm font-medium", changeColor)}>
                      <ChangeIcon className="w-3.5 h-3.5 mr-1" />
                      {changePrefix}{changeValue}%
                    </div>
                    <span className="text-xs text-muted-foreground ml-1">vs last month</span>
                  </>
                )}
              </div>
            ) : description ? (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-sm text-muted-foreground">{description}</span>
              </div>
            ) : null}
          </div>
          
          <div className={cn(
            "p-3 rounded-xl bg-gradient-to-br shadow-sm",
            gradient
          )}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
