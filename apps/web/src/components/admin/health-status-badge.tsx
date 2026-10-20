import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';

interface HealthStatusBadgeProps {
  status: HealthStatus;
  className?: string;
  showIcon?: boolean;
}

export function HealthStatusBadge({ status, className, showIcon = true }: HealthStatusBadgeProps) {
  switch (status) {
    case 'HEALTHY':
      return (
        <Badge
          className={cn(
            'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 font-medium',
            className
          )}
        >
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
          Healthy
        </Badge>
      );
    case 'DEGRADED':
      return (
        <Badge
          className={cn(
            'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20 font-medium',
            className
          )}
        >
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 mr-1" />}
          Degraded
        </Badge>
      );
    case 'UNHEALTHY':
      return (
        <Badge
          className={cn(
            'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20 font-medium',
            className
          )}
        >
          {showIcon && <XCircle className="w-3.5 h-3.5 mr-1" />}
          Unhealthy
        </Badge>
      );
    case 'UNKNOWN':
    default:
      return (
        <Badge
          className={cn(
            'bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/20 font-medium',
            className
          )}
        >
          {showIcon && <HelpCircle className="w-3.5 h-3.5 mr-1" />}
          Unknown
        </Badge>
      );
  }
}
