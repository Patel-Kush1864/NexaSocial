/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { useConnectedAccounts, useConnectedAccountStatistics } from '@/hooks/use-admin';
import { PageHeader } from '@/components/shared/page-header';
import { ConnectedAccountsTable } from './components/connected-accounts-table';
import { ConnectedAccountDetailsDrawer } from './components/connected-account-details-drawer';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link2, CheckCircle2, Clock, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminPagination } from '@/components/admin/shared/admin-pagination';


export default function ConnectedAccountsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const [platform, setPlatform] = useState<string>('ALL');
  const [status, setStatus] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);

  const { data, isLoading, refetch, isRefetching } = useConnectedAccounts({
    page,
    limit,
    search: debouncedSearch || undefined,
    platform: platform !== 'ALL' ? platform : undefined,
    status: status !== 'ALL' ? status : undefined,
    sortBy,
    sortOrder,
  });

  const { data: stats, isLoading: isStatsLoading } = useConnectedAccountStatistics();

  const handleRefresh = () => {
    refetch();
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

  const hasActiveFilters = search || platform !== 'ALL' || status !== 'ALL';

  const clearFilters = () => {
    setSearch('');
    setPlatform('ALL');
    setStatus('ALL');
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Connected Accounts"
        description="Monitor social accounts connected across the NexaSocial platform."
        action={
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefetching}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* STATISTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? '-' : stats?.total || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? '-' : stats?.active || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? '-' : stats?.error || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? '-' : stats?.expired || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disconnected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? '-' : stats?.disconnected || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Input
          placeholder="Search connected accounts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Select value={platform} onValueChange={(val) => { setPlatform(val || 'ALL'); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Platforms</SelectItem>
            <SelectItem value="YOUTUBE">YouTube</SelectItem>
            <SelectItem value="FACEBOOK">Facebook</SelectItem>
            <SelectItem value="INSTAGRAM">Instagram</SelectItem>
            <SelectItem value="TWITTER">X (Twitter)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(val) => { setStatus(val || 'ALL'); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="CONNECTED">Connected</SelectItem>
            <SelectItem value="TOKEN_EXPIRED">Expired</SelectItem>
            <SelectItem value="ERROR">Error</SelectItem>
            <SelectItem value="DISCONNECTED">Disconnected</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* TABLE */}
      <ConnectedAccountsTable
        data={data?.data || []}
        isLoading={isLoading}
        onRowClick={(account) => setSelectedAccount(account)}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />

      {/* PAGINATION */}
      {data?.pagination?.total > 0 && (
        <AdminPagination
          page={page}
          limit={limit}
          total={data.pagination.total}
          totalPages={data.pagination.totalPages}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      )}

      {/* DETAILS DRAWER */}
      <ConnectedAccountDetailsDrawer
        account={selectedAccount}
        open={!!selectedAccount}
        onOpenChange={(open) => !open && setSelectedAccount(null)}
      />
    </div>
  );
}
