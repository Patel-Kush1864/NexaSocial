import React from 'react';
import { Users, Share2, Play, CreditCard, HardDrive } from 'lucide-react';
import dayjs from 'dayjs';

interface OverviewTabProps {
  workspace: any;
}

export function OverviewTab({ workspace }: OverviewTabProps) {
  const stats = [
    { label: 'Members', value: workspace.memberCount, icon: Users },
    { label: 'Social', value: workspace.socialAccountCount, icon: Share2 },
    { label: 'Streams', value: workspace.streamCount, icon: Play },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <h3 className="text-lg font-semibold mb-4 border-b border-border/50 pb-2">Workspace Information</h3>
          <dl className="space-y-4">
            <div className="grid grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Name</dt>
              <dd className="text-sm col-span-2">{workspace.name}</dd>
            </div>
            <div className="grid grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Slug</dt>
              <dd className="text-sm col-span-2 font-mono">{workspace.slug}</dd>
            </div>
            <div className="grid grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Timezone</dt>
              <dd className="text-sm col-span-2">{workspace.timezone}</dd>
            </div>
            <div className="grid grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Created</dt>
              <dd className="text-sm col-span-2">{dayjs(workspace.created_at).format('MMM D, YYYY h:mm A')}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-border/50 glass-panel p-6">
          <h3 className="text-lg font-semibold mb-4 border-b border-border/50 pb-2">Subscription & Owner</h3>
          <dl className="space-y-4">
            <div className="grid grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Owner</dt>
              <dd className="text-sm col-span-2">{workspace.owner?.name}</dd>
            </div>
            <div className="grid grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Owner Email</dt>
              <dd className="text-sm col-span-2">{workspace.owner?.email}</dd>
            </div>
            <div className="grid grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Plan</dt>
              <dd className="text-sm col-span-2">{workspace.subscription?.planName || 'Free / None'}</dd>
            </div>
            <div className="grid grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Sub Status</dt>
              <dd className="text-sm col-span-2">{workspace.subscription?.status || '-'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
