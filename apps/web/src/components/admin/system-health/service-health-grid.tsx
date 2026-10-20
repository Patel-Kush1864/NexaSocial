'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SystemHealthResult } from '@/types';
import { formatDistanceToNow } from 'date-fns';

function ServiceCard({ service }: { service: SystemHealthResult['services'][0] }) {
  const statusColor = {
    HEALTHY: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    DEGRADED: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    UNHEALTHY: 'bg-destructive/10 text-destructive border-destructive/20',
    UNKNOWN: 'bg-muted text-muted-foreground border-border',
  }[service.status] || 'bg-muted';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium uppercase">{service.name}</CardTitle>
        <Badge variant="outline" className={statusColor}>
          {service.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {service.responseTimeMs !== null ? `${service.responseTimeMs} ms` : 'N/A'}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Uptime: {service.uptimePercentage}%
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Checked {formatDistanceToNow(new Date(service.checkedAt), { addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  );
}

export function ServiceHealthGrid({ services }: { services: SystemHealthResult['services'] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <ServiceCard key={service.name} service={service} />
      ))}
    </div>
  );
}
