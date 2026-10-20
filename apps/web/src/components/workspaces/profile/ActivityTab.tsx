import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Activity } from 'lucide-react';

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
    <div className="space-y-4">
      <div className="rounded-xl border border-border/50 glass-panel p-6">
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {activities.map((activity: any, idx: number) => (
            <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                <Activity className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm capitalize">{activity.action.replace(/_/g, ' ').toLowerCase()}</span>
                  <span className="text-xs text-muted-foreground">{dayjs(activity.created_at).fromNow()}</span>
                </div>
                <div className="text-sm text-muted-foreground">{activity.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
