import React from 'react';
import { Briefcase, CreditCard, Play, Share2 } from 'lucide-react';
import dayjs from 'dayjs';

interface OverviewTabProps {
  user: any;
  workspacesTotal: number;
  paymentsTotal: number;
  streamsTotal: number;
  socialAccountsTotal: number;
}

export function OverviewTab({
  user,
  workspacesTotal,
  paymentsTotal,
  streamsTotal,
  socialAccountsTotal,
}: OverviewTabProps) {
  const stats = [
    { label: 'Workspaces', value: workspacesTotal, icon: Briefcase },
    { label: 'Social Accounts', value: socialAccountsTotal, icon: Share2 },
    { label: 'Live Streams', value: streamsTotal, icon: Play },
    { label: 'Payments', value: paymentsTotal, icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-border/50 glass-panel flex flex-col items-center justify-center text-center">
            <stat.icon className="w-6 h-6 text-muted-foreground mb-2" />
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border/50 glass-panel p-6">
          <h3 className="text-lg font-semibold mb-4 border-b border-border/50 pb-2">Profile Information</h3>
          <dl className="space-y-4">
            <div className="grid grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd className="text-sm col-span-2">{user.email}</dd>
            </div>
            <div className="grid grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
              <dd className="text-sm col-span-2">{user.phoneNumber || 'Not provided'}</dd>
            </div>
            <div className="grid grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Status</dt>
              <dd className="text-sm col-span-2">{user.status}</dd>
            </div>
            <div className="grid grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Role</dt>
              <dd className="text-sm col-span-2">{user.role?.name}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-border/50 glass-panel p-6">
          <h3 className="text-lg font-semibold mb-4 border-b border-border/50 pb-2">Account Activity</h3>
          <dl className="space-y-4">
            <div className="grid grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Created</dt>
              <dd className="text-sm col-span-2">{dayjs(user.created_at).format('MMM D, YYYY h:mm A')}</dd>
            </div>
            <div className="grid grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Updated</dt>
              <dd className="text-sm col-span-2">{dayjs(user.updated_at).format('MMM D, YYYY h:mm A')}</dd>
            </div>
            <div className="grid grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Last Login</dt>
              <dd className="text-sm col-span-2">
                {user.lastLoginAt ? dayjs(user.lastLoginAt).format('MMM D, YYYY h:mm A') : 'Never logged in'}
              </dd>
            </div>
            <div className="grid grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Verified</dt>
              <dd className="text-sm col-span-2">{user.isEmailVerified ? 'Yes' : 'No'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
