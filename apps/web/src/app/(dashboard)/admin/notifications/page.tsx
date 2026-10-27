'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  BellRing,
  Users,
  MailCheck,
  AlertTriangle,
  Search,
  X,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { useAdminNotifications, useAdminNotificationStatistics } from '@/hooks/use-admin';
import { StatCard } from '@/components/cards/stat-card';
import { NotificationsTable } from './components/notifications-table';
import { NotificationComposer } from './components/notification-composer';
import { NotificationDetailsDrawer } from './components/notification-details-drawer';
import { AdminPagination } from '@/components/admin/shared/admin-pagination';
import { useQueryClient } from '@tanstack/react-query';

export function AdminNotificationsPage() {
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [targetFilter, setTargetFilter] = useState('ALL');

  const queryClient = useQueryClient();
  const { data: statsData, isLoading: isLoadingStats } = useAdminNotificationStatistics();
  const { data: notificationsData, isLoading: isLoadingNotifications, isFetching } = useAdminNotifications({
    page,
    limit,
    sortBy,
    sortOrder,
    search: search.trim() || undefined,
    type: typeFilter !== 'ALL' ? typeFilter : undefined,
    targetType: targetFilter !== 'ALL' ? targetFilter : undefined,
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

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
  };

  const hasActiveFilters = Boolean(search || typeFilter !== 'ALL' || targetFilter !== 'ALL');

  const handleClearFilters = () => {
    setSearch('');
    setTypeFilter('ALL');
    setTargetFilter('ALL');
    setPage(1);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      {/* Page Header */}
      <PageHeader
        title="Platform Notifications"
        description="Dispatch platform-wide announcements, system alerts, and monitor delivery across users and workspaces."
        action={
          <Button
            onClick={() => setIsComposerOpen(true)}
            className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all h-10 px-4"
          >
            <Plus className="w-4 h-4" />
            Send Notification
          </Button>
        }
      />

      {/* Analytics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Sent"
          value={isLoadingStats ? '...' : (statsData?.total || 0)}
          icon={BellRing}
          gradient="from-violet-600 to-indigo-600"
        />
        <StatCard
          title="Broadcasts"
          value={isLoadingStats ? '...' : (statsData?.broadcasts || 0)}
          icon={Users}
          gradient="from-purple-600 to-pink-600"
        />
        <StatCard
          title="Read Delivery"
          value={isLoadingStats ? '...' : (statsData?.read || 0)}
          icon={MailCheck}
          gradient="from-blue-600 to-cyan-600"
        />
        <StatCard
          title="Pending Unread"
          value={isLoadingStats ? '...' : (statsData?.unread || 0)}
          icon={AlertTriangle}
          gradient="from-amber-500 to-rose-600"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search notifications by title or message..."
              className="pl-9 pr-9 h-10 bg-background/60 border-border/60 hover:border-primary/40 focus:ring-primary/20 transition-all text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type & Target Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-full sm:w-[170px]">
              <Select
                value={typeFilter}
                onValueChange={(val) => {
                  setTypeFilter(val || 'ALL');
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10 bg-background/60 border-border/60 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="All Types" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-md border-border/80">
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="ANNOUNCEMENT">Announcements</SelectItem>
                  <SelectItem value="SYSTEM">System Updates</SelectItem>
                  <SelectItem value="UPDATE">Feature Updates</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="WARNING">Warnings</SelectItem>
                  <SelectItem value="SECURITY">Security Alerts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-[170px]">
              <Select
                value={targetFilter}
                onValueChange={(val) => {
                  setTargetFilter(val || 'ALL');
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10 bg-background/60 border-border/60 text-xs">
                  <SelectValue placeholder="All Audiences" />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-md border-border/80">
                  <SelectItem value="ALL">All Audiences</SelectItem>
                  <SelectItem value="ALL_USERS">All Users</SelectItem>
                  <SelectItem value="ALL_WORKSPACES">All Workspaces</SelectItem>
                  <SelectItem value="SPECIFIC_USER">Specific User</SelectItem>
                  <SelectItem value="SPECIFIC_WORKSPACE">Specific Workspace</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isFetching}
              title="Refresh notifications"
              className="h-10 w-10 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-10 text-xs text-muted-foreground hover:text-foreground px-2"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="space-y-4">
        <NotificationsTable
          notifications={notificationsData?.data || []}
          isLoading={isLoadingNotifications}
          onViewDetails={setSelectedNotification}
          onSort={handleSort}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSendFirst={() => setIsComposerOpen(true)}
        />

        {total > 0 && (
          <div className="pt-2">
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
          </div>
        )}
      </div>

      {/* Send Notification Composer Drawer */}
      <NotificationComposer
        open={isComposerOpen}
        onOpenChange={setIsComposerOpen}
      />

      {/* Notification Details Drawer */}
      <NotificationDetailsDrawer
        notification={selectedNotification}
        open={!!selectedNotification}
        onOpenChange={(open) => !open && setSelectedNotification(null)}
      />
    </div>
  );
}

export default AdminNotificationsPage;
