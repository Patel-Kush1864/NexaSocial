'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemHealthResult } from '@/types';

export function QueueMonitoringCard({ queue }: { queue: SystemHealthResult['queue'] }) {
  if (!queue) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Queue Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Queue metrics unavailable</p>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    { label: 'Waiting', value: queue.waiting },
    { label: 'Active', value: queue.active },
    { label: 'Completed', value: queue.completed },
    { label: 'Failed', value: queue.failed },
    { label: 'Delayed', value: queue.delayed },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Queue Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {metrics.map((m) => (
            <div key={m.label} className="flex flex-col">
              <span className="text-xs text-muted-foreground">{m.label}</span>
              <span className="text-2xl font-bold">{m.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
