'use client';

import { useWorkspaceStore } from '@/stores/workspace-store';
import { useNotifications } from '@/hooks/use-notifications';
import { PageHeader } from '@/components/shared/page-header';
import { NotificationItem } from '@/components/cards/notification-item';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { Bell, CheckCheck } from 'lucide-react';

export function NotificationsPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(currentWorkspace?.id);

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading notifications..." />;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <PageHeader
        title="Notifications Center"
        description="Stay updated with system dispatches, live stream status changes, and member invites."
        badge={unreadCount > 0 ? `${unreadCount} Unread` : 'All Read'}
        action={
          unreadCount > 0 ? (
            <Button
              onClick={() => markAllAsRead()}
              variant="outline"
              className="h-10 text-xs font-semibold glass-panel"
            >
              <CheckCheck className="w-4 h-4 mr-2 text-primary" />
              Mark All as Read
            </Button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All Caught Up!"
          description="You don't have any unread notifications right now. System alerts will appear here in real time."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
