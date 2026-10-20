import React from 'react';
import dayjs from 'dayjs';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export function LiveStreamsTab({ data, isLoading }: { data: any, isLoading: boolean }) {
  if (isLoading) return <LoadingSpinner size="md" label="Loading streams..." />;
  
  const streams = data?.data || [];

  if (streams.length === 0) {
    return (
      <div className="text-center p-8 rounded-xl border border-border/50 glass-panel">
        <p className="text-muted-foreground">No live streams found for this user.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 glass-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
            <tr>
              <th className="px-6 py-4 font-medium">Title</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Scheduled For</th>
              <th className="px-6 py-4 font-medium">Actual Start</th>
              <th className="px-6 py-4 font-medium">Created At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {streams.map((stream: any) => (
              <tr key={stream.id} className="hover:bg-secondary/10 transition-colors">
                <td className="px-6 py-4 font-medium">{stream.title}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    stream.status === 'LIVE' ? 'bg-red-500/10 text-red-500' :
                    stream.status === 'COMPLETED' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {stream.status}
                  </span>
                </td>
                <td className="px-6 py-4">{stream.scheduled_start_time ? dayjs(stream.scheduled_start_time).format('MMM D, YYYY h:mm A') : '-'}</td>
                <td className="px-6 py-4">{stream.actual_start_time ? dayjs(stream.actual_start_time).format('MMM D, YYYY h:mm A') : '-'}</td>
                <td className="px-6 py-4 text-muted-foreground">{dayjs(stream.created_at).format('MMM D, YYYY')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
