'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { SystemHealthResult } from '@/types';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

export function OverallStatusCard({ data }: { data: SystemHealthResult }) {
  const healthyCount = data.services.filter(s => s.status === 'HEALTHY').length;
  const totalCount = data.services.length;

  const StatusIcon = {
    HEALTHY: CheckCircle2,
    DEGRADED: AlertTriangle,
    UNHEALTHY: XCircle,
    UNKNOWN: HelpCircle,
  }[data.overallStatus] || HelpCircle;

  const statusColor = {
    HEALTHY: 'bg-emerald-500/10 text-emerald-500',
    DEGRADED: 'bg-amber-500/10 text-amber-500',
    UNHEALTHY: 'bg-destructive/10 text-destructive',
    UNKNOWN: 'bg-muted text-muted-foreground',
  }[data.overallStatus] || 'bg-muted';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Overall System Status</CardTitle>
        <Badge variant="outline" className={statusColor}>
          {data.overallStatus}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <StatusIcon className={`h-10 w-10 ${statusColor.split(' ')[1]}`} />
          <div>
            <div className="text-2xl font-bold">
              {healthyCount} / {totalCount} Services Healthy
            </div>
            <p className="text-xs text-muted-foreground">
              Last checked {formatDistanceToNow(new Date(data.checkedAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
