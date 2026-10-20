import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

dayjs.extend(relativeTime);

export function ActivityTab({ data, isLoading }: { data: any, isLoading: boolean }) {
  if (isLoading) return <LoadingSpinner size="md" label="Loading activity..." />;
  
  const activities = data?.data || [];

  if (activities.length === 0) {
    return (
      <div className="text-center p-8 rounded-xl border border-border/50 glass-panel">
        <p className="text-muted-foreground">No recent activity found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 glass-panel p-6">
      <div className="relative border-l border-border/50 ml-3 space-y-8 py-2">
        {activities.map((activity: any) => (
          <div key={activity.id} className="relative pl-6">
            <div className="absolute w-3 h-3 bg-primary/20 rounded-full border border-primary -left-[6.5px] top-1.5" />
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-secondary text-secondary-foreground w-fit">
                {activity.action}
              </span>
              <span className="text-sm text-muted-foreground">
                {dayjs(activity.created_at).fromNow()}
              </span>
            </div>
            <p className="text-sm">{activity.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
