import React from 'react';
import { useSystemHealth } from '@/hooks/use-system-health';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle2, XCircle, HelpCircle, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export function SystemHealth() {
  const { data, isLoading, error, isRefetching } = useSystemHealth();

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-xl font-bold tracking-tight">System Health</h2>
        </div>
        <div className="p-8 border border-border/50 rounded-xl bg-accent/20 flex flex-col items-center justify-center text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-500" />
          <div>
            <h3 className="font-semibold text-lg">Health data unavailable</h3>
            <p className="text-muted-foreground text-sm max-w-md mt-1">
              Unable to retrieve system health information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getOverallStatusDisplay = () => {
    if (isLoading && !data) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Checking systems...</span>
        </div>
      );
    }

    if (!data) return null;

    switch (data.overallStatus) {
      case 'HEALTHY':
        return (
          <div className="flex items-center gap-2 text-emerald-500 font-medium">
            <CheckCircle2 className="w-5 h-5" />
            <span>All Systems Operational</span>
          </div>
        );
      case 'DEGRADED':
        return (
          <div className="flex items-center gap-2 text-amber-500 font-medium">
            <AlertTriangle className="w-5 h-5" />
            <span>Some Systems Degraded</span>
          </div>
        );
      case 'UNHEALTHY':
        return (
          <div className="flex items-center gap-2 text-rose-500 font-medium">
            <XCircle className="w-5 h-5" />
            <span>System Issues Detected</span>
          </div>
        );
      case 'UNKNOWN':
      default:
        return (
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <HelpCircle className="w-5 h-5" />
            <span>Health Status Unknown</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight mb-1">System Health</h2>
          {getOverallStatusDisplay()}
        </div>
        
        <Link href="/admin/system-health">
          <Button 
            variant="outline" 
            size="sm" 
            className="self-start sm:self-auto"
          >
            View System Health
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      {(isLoading && !data) ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : (
        <div className="p-6 border border-border/50 rounded-xl bg-card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Healthy Services</p>
              <p className="text-2xl font-bold">
                {data?.services?.filter(s => s.status === 'HEALTHY').length || 0} / {data?.services?.length || 0}
              </p>
            </div>
            {isRefetching && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
        </div>
      )}
    </div>
  );
}
