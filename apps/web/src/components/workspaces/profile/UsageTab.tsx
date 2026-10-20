import React from 'react';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export function UsageTab({ data, isLoading }: { data: any, isLoading: boolean }) {
  if (isLoading) return <LoadingSpinner size="md" label="Loading usage data..." />;
  
  if (!data) return null;

  const usageItems = [
    { label: 'Team Members', current: data.members, limit: data.memberLimit },
    { label: 'Social Accounts', current: data.socialAccounts, limit: data.socialAccountLimit },
    { label: 'Live Streams', current: data.streams, limit: -1 }, // -1 means unlimited or arbitrary in this context
  ];

  return (
    <div className="rounded-xl border border-border/50 glass-panel p-6">
      <h3 className="text-lg font-semibold mb-6">Workspace Usage</h3>
      
      <div className="space-y-6">
        {usageItems.map((item, idx) => {
          const isUnlimited = item.limit === -1 || item.limit === 0;
          const percentage = isUnlimited ? 0 : Math.min(100, Math.round((item.current / item.limit) * 100));
          
          return (
            <div key={idx}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-sm text-muted-foreground">
                  {item.current} {isUnlimited ? '' : `/ ${item.limit}`}
                </span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                {!isUnlimited && (
                  <div 
                    className={`h-full ${percentage >= 100 ? 'bg-destructive' : percentage > 80 ? 'bg-amber-500' : 'bg-primary'}`} 
                    style={{ width: `${percentage}%` }}
                  />
                )}
                {isUnlimited && (
                  <div className="h-full bg-primary/30 w-full" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
