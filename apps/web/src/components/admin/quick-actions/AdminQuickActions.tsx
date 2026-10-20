import React from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { adminQuickActions } from './quick-actions.config';
import { QuickActionCard } from './QuickActionCard';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminQuickActions() {
  const { hasPermission, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold">Quick Actions</h3>
          <p className="text-sm text-muted-foreground">Manage NexaSocial platform operations quickly.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Filter actions based on permissions
  const availableActions = adminQuickActions.filter((action) =>
    hasPermission(action.permission)
  );

  // Do not render anything if no actions are available
  if (availableActions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 pt-4 border-t border-border/50">
      <div>
        <h3 className="text-lg font-bold">Quick Actions</h3>
        <p className="text-sm text-muted-foreground">Manage NexaSocial platform operations quickly.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {availableActions.map((action) => (
          <QuickActionCard key={action.key} action={action} />
        ))}
      </div>
    </div>
  );
}
