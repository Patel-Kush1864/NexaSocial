'use client';

import Link from 'next/link';
import { LucideIcon, TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';
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
  subtitle?: string;
  href?: string;
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
  subtitle,
  href,
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

  const cardNode = (
    <Card
      className={cn(
        'overflow-hidden border border-border/50 shadow-sm relative group bg-card transition-all duration-200 hover:shadow-md hover:border-border',
        href && 'cursor-pointer hover:border-primary/40 hover:-translate-y-0.5'
      )}
    >
      <div
        className={cn(
          'absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 rounded-full blur-3xl -mr-10 -mt-10 transition-all duration-300 group-hover:opacity-25',
          gradient
        )}
      />
      
      <CardContent className="p-4 sm:p-5 xl:p-6 relative z-10">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground tracking-tight leading-snug">{title}</p>
              {href && (
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/60 opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all duration-200 shrink-0" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl xl:text-3xl font-bold tracking-tight text-foreground" title={value.toString()}>{value}</h2>
            </div>
            {change !== undefined && direction !== undefined ? (
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {(!isFinite(changeValue) || isNaN(changeValue)) ? (
                  <span className="text-[11px] sm:text-xs text-muted-foreground">No comparison data</span>
                ) : direction === 'neutral' ? (
                  <span className="text-[11px] sm:text-xs text-muted-foreground">No change vs last month</span>
                ) : (
                  <>
                    <div className={cn("flex items-center text-xs sm:text-sm font-semibold", changeColor)}>
                      <ChangeIcon className="w-3.5 h-3.5 mr-0.5" />
                      {changePrefix}{changeValue}%
                    </div>
                    <span className="text-[11px] sm:text-xs text-muted-foreground">vs last month</span>
                  </>
                )}
              </div>
            ) : description ? (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs text-muted-foreground truncate">{description}</span>
              </div>
            ) : null}

            {subtitle && (
              <p className="text-[11px] text-muted-foreground/75 font-medium pt-0.5 leading-snug">{subtitle}</p>
            )}
          </div>
          
          <div className={cn(
            "p-2.5 rounded-xl bg-gradient-to-br shadow-sm shrink-0 transition-transform duration-200 group-hover:scale-105",
            gradient
          )}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
        {cardNode}
      </Link>
    );
  }

  return cardNode;
}
