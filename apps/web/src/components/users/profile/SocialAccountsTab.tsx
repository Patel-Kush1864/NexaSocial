import React from 'react';
import dayjs from 'dayjs';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export function SocialAccountsTab({ data, isLoading }: { data: any, isLoading: boolean }) {
  if (isLoading) return <LoadingSpinner size="md" label="Loading social accounts..." />;
  
  const accounts = data?.data || [];

  if (accounts.length === 0) {
    return (
      <div className="text-center p-8 rounded-xl border border-border/50 glass-panel">
        <p className="text-muted-foreground">No connected social accounts found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 glass-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
            <tr>
              <th className="px-6 py-4 font-medium">Platform</th>
              <th className="px-6 py-4 font-medium">Account Name</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Connected At</th>
              <th className="px-6 py-4 font-medium">Last Sync</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {accounts.map((account: any) => (
              <tr key={account.id} className="hover:bg-secondary/10 transition-colors">
                <td className="px-6 py-4 font-medium capitalize">{account.platform_name}</td>
                <td className="px-6 py-4">{account.account_name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex w-fit items-center gap-1.5 ${
                    account.connection_status === 'CONNECTED' ? 'bg-green-500/10 text-green-500' : 
                    account.connection_status === 'ERROR' ? 'bg-red-500/10 text-red-500' : 'bg-secondary text-secondary-foreground'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {account.connection_status}
                  </span>
                </td>
                <td className="px-6 py-4">{dayjs(account.created_at).format('MMM D, YYYY')}</td>
                <td className="px-6 py-4">
                  {account.last_sync_at ? dayjs(account.last_sync_at).fromNow() : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
