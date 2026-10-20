import React from 'react';
import dayjs from 'dayjs';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export function WorkspacesTab({ data, isLoading }: { data: any, isLoading: boolean }) {
  if (isLoading) return <LoadingSpinner size="md" label="Loading workspaces..." />;
  
  const workspaces = data?.data || [];

  if (workspaces.length === 0) {
    return (
      <div className="text-center p-8 rounded-xl border border-border/50 glass-panel">
        <p className="text-muted-foreground">This user is not currently a member of any workspace.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 glass-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
            <tr>
              <th className="px-6 py-4 font-medium">Workspace Name</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Joined At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {workspaces.map((workspace: any) => (
              <tr key={workspace.id} className="hover:bg-secondary/10 transition-colors">
                <td className="px-6 py-4 font-medium">{workspace.name}</td>
                <td className="px-6 py-4">{workspace.role}</td>
                <td className="px-6 py-4">
                  <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-medium">
                    {workspace.status}
                  </span>
                </td>
                <td className="px-6 py-4">{dayjs(workspace.joined_at).format('MMM D, YYYY')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
