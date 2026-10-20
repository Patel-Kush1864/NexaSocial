'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemHealthResult } from '@/types';
import { Badge } from '@/components/ui/badge';

export function DatabaseMetricsCard({ database }: { database: SystemHealthResult['database'] }) {
  if (!database) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Database Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Metrics unavailable</p>
        </CardContent>
      </Card>
    );
  }

  const statusColor = {
    HEALTHY: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    DEGRADED: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    UNHEALTHY: 'bg-destructive/10 text-destructive border-destructive/20',
    UNKNOWN: 'bg-muted text-muted-foreground border-border',
  }[database.status] || 'bg-muted';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Database Metrics</CardTitle>
        <Badge variant="outline" className={statusColor}>{database.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground truncate">Response Time</div>
          <div className="text-lg font-medium mt-1 truncate" title={database.responseTimeMs !== null ? `${database.responseTimeMs} ms` : 'N/A'}>
            {database.responseTimeMs !== null ? `${database.responseTimeMs} ms` : 'N/A'}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground truncate">Active Connections</div>
          <div className="text-lg font-medium mt-1 truncate" title={database.activeConnections !== undefined ? String(database.activeConnections) : 'N/A'}>
            {database.activeConnections !== undefined ? database.activeConnections : 'N/A'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
