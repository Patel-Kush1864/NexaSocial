'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemHealthResult } from '@/types';

export function RuntimeMetricsCard({ runtime }: { runtime: SystemHealthResult['runtime'] }) {
  if (!runtime) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Runtime Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Metrics unavailable</p>
        </CardContent>
      </Card>
    );
  }

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Runtime Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-xs text-muted-foreground">CPU Load Average (1m, 5m, 15m)</div>
          <div className="text-lg font-medium mt-1">
            {runtime.cpu.loadAvg.map((n) => n.toFixed(2)).join(', ')}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Memory Usage</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            <div>
              <span className="text-xs text-muted-foreground mr-2">RSS:</span>
              <span className="font-medium text-sm">{formatBytes(runtime.memory.rssBytes)}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground mr-2">Heap Used:</span>
              <span className="font-medium text-sm">{formatBytes(runtime.memory.heapUsedBytes)}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground mr-2">Heap Total:</span>
              <span className="font-medium text-sm">{formatBytes(runtime.memory.heapTotalBytes)}</span>
            </div>
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Process Uptime</div>
          <div className="text-lg font-medium mt-1">{formatUptime(runtime.uptimeSeconds)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
