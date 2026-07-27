import type { ReactNode } from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  gradient?: string;
  children?: ReactNode;
}

export function StatCard({
  title,
  value,
  change,
  isPositive = true,
  icon: Icon,
  gradient = 'from-violet-600 to-indigo-600',
  children,
}: StatCardProps) {
  return (
    <Card className="glass-panel border-border/50 shadow-lg relative overflow-hidden group hover:border-primary/40 transition-all">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {value}
            </h3>
          </div>

          <div
            className={cn(
              'w-12 h-12 rounded-2xl bg-gradient-to-tr flex items-center justify-center text-white shadow-lg shrink-0 group-hover:scale-110 transition-transform',
              gradient,
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
        </div>

        {(change || children) && (
          <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-xs">
            {change && (
              <div
                className={cn(
                  'flex items-center gap-1 font-semibold',
                  isPositive ? 'text-emerald-500' : 'text-rose-500',
                )}
              >
                {isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>{change} vs last period</span>
              </div>
            )}
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
