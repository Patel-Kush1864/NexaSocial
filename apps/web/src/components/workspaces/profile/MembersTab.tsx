import React from 'react';
import dayjs from 'dayjs';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Badge } from '@/components/ui/badge';

export function MembersTab({ data, isLoading }: { data: any, isLoading: boolean }) {
  if (isLoading) return <LoadingSpinner size="md" label="Loading members..." />;
  
  const members = data?.data || [];

  if (members.length === 0) {
    return (
      <div className="text-center p-8 rounded-xl border border-border/50 glass-panel">
        <p className="text-muted-foreground">No members found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 glass-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Workspace Role</th>
              <th className="px-6 py-4 font-medium">User Status</th>
              <th className="px-6 py-4 font-medium">Joined At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {members.map((m: any) => (
              <tr key={m.id} className="hover:bg-secondary/10 transition-colors">
                <td className="px-6 py-4 font-medium">{m.first_name} {m.last_name}</td>
                <td className="px-6 py-4 text-muted-foreground">{m.email}</td>
                <td className="px-6 py-4">
                  <Badge variant="outline">{m.role}</Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge className={
                    m.user_status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                    'bg-secondary text-secondary-foreground'
                  }>
                    {m.user_status}
                  </Badge>
                </td>
                <td className="px-6 py-4">{dayjs(m.joined_at).format('MMM D, YYYY')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
