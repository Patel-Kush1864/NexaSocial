import React from 'react';
import dayjs from 'dayjs';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export function SubscriptionTab({ data, isLoading }: { data: any, isLoading: boolean }) {
  if (isLoading) return <LoadingSpinner size="md" label="Loading subscriptions..." />;
  
  const subscriptions = data?.data || [];

  if (subscriptions.length === 0) {
    return (
      <div className="text-center p-8 rounded-xl border border-border/50 glass-panel">
        <p className="text-muted-foreground">No subscriptions found for this workspace owner.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {subscriptions.map((sub: any) => (
        <div key={sub.id} className="rounded-xl border border-border/50 glass-panel p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold">{sub.plan_name || 'Unknown Plan'}</h3>
              <p className="text-sm text-muted-foreground capitalize">{sub.interval || 'Monthly'}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              sub.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
            }`}>
              {sub.status}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <dt className="text-sm font-medium text-muted-foreground mb-1">Started</dt>
              <dd className="text-sm">{dayjs(sub.current_period_start).format('MMM D, YYYY')}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground mb-1">Ends / Renews</dt>
              <dd className="text-sm">{dayjs(sub.current_period_end).format('MMM D, YYYY')}</dd>
            </div>
          </dl>
          {sub.cancel_at_period_end && (
            <div className="mt-4 text-sm text-amber-500 bg-amber-500/10 p-3 rounded-lg">
              Set to cancel at the end of the current billing period.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
