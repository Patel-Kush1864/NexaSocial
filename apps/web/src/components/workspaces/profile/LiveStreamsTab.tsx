import React from 'react';
import dayjs from 'dayjs';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Badge } from '@/components/ui/badge';

export function LiveStreamsTab({ data, isLoading }: { data: any, isLoading: boolean }) {
  if (isLoading) return <LoadingSpinner size="md" label="Loading streams..." />;
  
  const streams = data?.data || [];

  if (streams.length === 0) {
    return (
      <div className="text-center p-8 rounded-xl border border-border/50 glass-panel">
        <p className="text-muted-foreground">No live streams found.</p>
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
              <th className="px-6 py-4 font-medium">Started At</th>
              <th className="px-6 py-4 font-medium">Created At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {streams.map((stream: any) => (
              <tr key={stream.id} className="hover:bg-secondary/10 transition-colors">
                <td className="px-6 py-4 font-medium max-w-[200px] truncate" title={stream.title}>
                  {stream.title}
                </td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className={`
                    ${stream.status === 'LIVE' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                    stream.status === 'SCHEDULED' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                    stream.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : ''}
                  `}>
                    {stream.status}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  {stream.scheduled_start_time ? dayjs(stream.scheduled_start_time).format('MMM D, YYYY h:mm A') : '-'}
                </td>
                <td className="px-6 py-4">
                  {stream.actual_start_time ? dayjs(stream.actual_start_time).format('MMM D, YYYY h:mm A') : '-'}
                </td>
                <td className="px-6 py-4">
                  {dayjs(stream.created_at).format('MMM D, YYYY')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
