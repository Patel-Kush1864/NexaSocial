'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Plus, BellRing, Users, MailCheck, AlertTriangle } from 'lucide-react';
import { useAdminNotifications, useAdminNotificationStatistics } from '@/hooks/use-admin';
import { StatCard } from '@/components/cards/stat-card';
import { NotificationsTable } from './components/notifications-table';
import { NotificationComposer } from './components/notification-composer';
import { NotificationDetailsDrawer } from './components/notification-details-drawer';
import { AdminPagination } from '@/components/admin/shared/admin-pagination';

export function AdminNotificationsPage() {
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: statsData, isLoading: isLoadingStats } = useAdminNotificationStatistics();
  const { data: notificationsData, isLoading: isLoadingNotifications } = useAdminNotifications({
    page,
    limit,
    sortBy,
    sortOrder,
  });

  const total = notificationsData?.pagination?.total || 0;
  const totalPages = notificationsData?.pagination?.totalPages || 0;

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <PageHeader
        title="Platform Notifications"
        description="Dispatch broadcasts and monitor platform-wide notification delivery."
        action={
          <Button onClick={() => setIsComposerOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Send Notification
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sent"
          value={statsData?.total || 0}
          icon={BellRing}
        />
        <StatCard
          title="Broadcasts"
          value={statsData?.broadcasts || 0}
          icon={Users}
        />
        <StatCard
          title="Read Notifications"
          value={statsData?.read || 0}
          icon={MailCheck}
        />
        <StatCard
          title="Unread"
          value={statsData?.unread || 0}
          icon={AlertTriangle}
        />
      </div>

      <div className="mt-8">
        <NotificationsTable
          notifications={notificationsData?.data || []}
          isLoading={isLoadingNotifications}
          onViewDetails={setSelectedNotification}
          onSort={handleSort}
          sortBy={sortBy}
          sortOrder={sortOrder}
        />

        {total > 0 && (
          <AdminPagination
            page={page}
            limit={limit}
            total={total}
            totalPages={totalPages}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        )}
      </div>

      <NotificationComposer
        open={isComposerOpen}
        onOpenChange={setIsComposerOpen}
      />

      <NotificationDetailsDrawer
        notification={selectedNotification}
        open={!!selectedNotification}
        onOpenChange={(open) => !open && setSelectedNotification(null)}
      />
    </div>
  );
}

export default AdminNotificationsPage;
