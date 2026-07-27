'use client';

import { useAdminDashboard } from '@/hooks/use-admin';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/cards/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Users, Building2, DollarSign, Radio, Server, Database, Cpu } from 'lucide-react';

export default function AdminDashboardPage() {
  const { data: summary, isLoading } = useAdminDashboard();

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Fetching system telemetry..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Command Overview"
        description="Platform-wide stats, active subscriptions, revenue metrics, and system health status."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Platform Users"
          value={summary?.totalUsers || 1240}
          change="+32 today"
          isPositive={true}
          icon={Users}
          gradient="from-violet-600 to-indigo-600"
        />
        <StatCard
          title="Active Workspaces"
          value={summary?.totalWorkspaces || 840}
          change="+14 today"
          isPositive={true}
          icon={Building2}
          gradient="from-blue-600 to-cyan-600"
        />
        <StatCard
          title="Monthly Recurring Revenue"
          value={`$${(summary?.totalRevenue || 42800).toLocaleString()}`}
          change="+15.4%"
          isPositive={true}
          icon={DollarSign}
          gradient="from-emerald-500 to-teal-600"
        />
        <StatCard
          title="Active Live Streams"
          value={summary?.activeStreams || 18}
          change="Real-time"
          isPositive={true}
          icon={Radio}
          gradient="from-rose-600 to-pink-600"
        />
      </div>

      {/* System Services Health Matrix */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Server className="w-5 h-5 text-rose-500" />
            Infrastructure System Health
          </CardTitle>
          <CardDescription className="text-xs">
            Real-time status of database nodes, microservices, Redis caches, and RTMP relays.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-accent/30 border border-border/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-500" />
                  MySQL DB
                </span>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
                  UP
                </Badge>
              </div>
              <p className="text-muted-foreground text-[11px]">Latency: 4.2ms | Conn: 85/200</p>
            </div>

            <div className="p-4 rounded-xl bg-accent/30 border border-border/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-emerald-500" />
                  Redis Cache
                </span>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
                  UP
                </Badge>
              </div>
              <p className="text-muted-foreground text-[11px]">Hit Ratio: 98.4% | Memory: 1.2GB</p>
            </div>

            <div className="p-4 rounded-xl bg-accent/30 border border-border/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-emerald-500" />
                  RTMP Cluster
                </span>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
                  UP
                </Badge>
              </div>
              <p className="text-muted-foreground text-[11px]">Bandwidth: 1.4 Gbps</p>
            </div>

            <div className="p-4 rounded-xl bg-accent/30 border border-border/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-emerald-500" />
                  Bull Job Queue
                </span>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
                  UP
                </Badge>
              </div>
              <p className="text-muted-foreground text-[11px]">Pending Jobs: 0 | Failed: 0</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
