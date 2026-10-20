'use client';

import { useState } from 'react';
import { SubscriptionsSummaryCards } from './components/subscriptions-summary-cards';
import { SubscriptionTable } from './components/subscription-table';
import { SubscriptionDetailsDrawer } from './components/subscription-details-drawer';
import { usePlatformSubscriptions } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { AdminTableToolbar, FilterConfig } from '@/components/admin/shared/admin-table-toolbar';
import { AdminPagination } from '@/components/admin/shared/admin-pagination';

export default function SubscriptionsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [plan, setPlan] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

  const { data, isLoading } = usePlatformSubscriptions({
    page,
    limit,
    search,
    status: status === 'ALL' || !status ? undefined : status,
    planId: plan || undefined,
    startDate: dateFrom || undefined,
    endDate: dateTo || undefined,
    sortBy,
    sortOrder,
  });

  const subscriptions = data?.data || [];
  const total = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.totalPages || 0;

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1); // Reset to first page on search
  };

  const handleViewDetails = (id: string) => {
    setSelectedSubId(id);
    setDrawerOpen(true);
  };

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
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Subscriptions</h2>
          <p className="text-muted-foreground">
            Monitor subscription status, plans, workspaces, billing periods, and renewal activity across the platform.
          </p>
        </div>
      </div>

      <SubscriptionsSummaryCards />

      <div className="flex flex-col gap-4">
        <AdminTableToolbar
          search={search}
          onSearchChange={(val) => { setSearch(val); setPage(1); }}
          filters={[
            { id: 'search', type: 'search' },
            {
              id: 'status',
              type: 'select',
              placeholder: 'All Statuses',
              options: [
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Trialing', value: 'TRIAL' },
                { label: 'Past Due', value: 'PAST_DUE' },
                { label: 'Cancelled', value: 'CANCELLED' },
                { label: 'Expired', value: 'EXPIRED' },
              ],
            },
            {
              id: 'plan',
              type: 'select',
              placeholder: 'All Plans',
              options: [
                { label: 'Free', value: 'Free' },
                { label: 'Pro', value: 'Pro' },
                { label: 'Business', value: 'Business' },
                { label: 'Enterprise', value: 'Enterprise' },
              ],
            },
            { id: 'dateFrom', type: 'date', placeholder: 'From Date' },
            { id: 'dateTo', type: 'date', placeholder: 'To Date' },
          ]}
          filterValues={{ status, plan, dateFrom, dateTo }}
          onFilterChange={(id, val) => {
            if (id === 'status') setStatus(val);
            if (id === 'plan') setPlan(val);
            if (id === 'dateFrom') setDateFrom(val);
            if (id === 'dateTo') setDateTo(val);
            setPage(1);
          }}
          onClearFilters={() => {
            setSearch('');
            setStatus('');
            setPlan('');
            setDateFrom('');
            setDateTo('');
            setPage(1);
          }}
          searchPlaceholder="Search workspaces, owners, emails..."
        />

        <SubscriptionTable 
          data={subscriptions} 
          isLoading={isLoading} 
          onViewDetails={handleViewDetails}
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

      <SubscriptionDetailsDrawer
        id={selectedSubId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
