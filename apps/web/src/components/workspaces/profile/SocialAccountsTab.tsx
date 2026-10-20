import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Badge } from '@/components/ui/badge';

dayjs.extend(relativeTime);

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
                <td className="px-6 py-4 font-medium capitalize">
                  <div className="flex items-center gap-2">
                    {account.profile_image_url && <img src={account.profile_image_url} alt="" className="w-6 h-6 rounded-full" />}
                    {account.platform_name}
                  </div>
                </td>
                <td className="px-6 py-4">{account.account_name}</td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className={`
                    ${account.connection_status === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                    account.connection_status === 'ERROR' ? 'bg-red-500/10 text-red-500 border-red-500/20' : ''}
                  `}>
                    {account.connection_status}
                  </Badge>
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
