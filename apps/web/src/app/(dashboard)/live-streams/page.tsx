/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useCallback } from 'react';
import { useLiveStreams, useLiveStreamStatistics } from '@/hooks/use-admin';
import { LiveStreamsTable } from './components/live-streams-table';
import { LiveStreamDetailsDrawer } from './components/live-stream-details-drawer';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AdminPagination } from '@/components/admin/shared/admin-pagination';
import { Search, RefreshCw, X } from 'lucide-react';
import { useEffect } from 'react';

export default function LiveStreamsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [platform, setPlatform] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const [selectedStream, setSelectedStream] = useState<any | null>(null);

  const { data: statsData, refetch: refetchStats } = useLiveStreamStatistics();
  const { data: streamsData, isLoading, refetch: refetchStreams } = useLiveStreams({
    page,
    limit,
    search: search || undefined,
    status: status !== 'ALL' ? status : undefined,
    platform: platform !== 'ALL' ? platform : undefined,
    sortBy,
    sortOrder,
  });

  const total = streamsData?.pagination?.total || 0;
  const totalPages = streamsData?.pagination?.totalPages || 0;

  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
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

  const handleRefresh = () => {
    refetchStats();
    refetchStreams();
  };

  const hasFilters = search || status !== 'ALL' || platform !== 'ALL';

  const clearFilters = () => {
    setSearch('');
    setStatus('ALL');
    setPlatform('ALL');
    setPage(1);
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Live Streams</h2>
          <p className="text-muted-foreground">
            Monitor streaming activity across all NexaSocial workspaces.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleRefresh} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Streams</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{statsData?.total || 0}</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Currently Live</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-destructive">{statsData?.live || 0}</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Scheduled</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{statsData?.scheduled || 0}</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Failed</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-destructive">{statsData?.failed || 0}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 py-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search streams, workspaces, or creators..."
            className="pl-8"
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <Select value={status} onValueChange={(val) => { setStatus(val || 'ALL'); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="LIVE">Live</SelectItem>
            <SelectItem value="ENDED">Ended</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={platform} onValueChange={(val) => { setPlatform(val || 'ALL'); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Platforms</SelectItem>
            <SelectItem value="YOUTUBE">YouTube</SelectItem>
            <SelectItem value="FACEBOOK">Facebook</SelectItem>
            <SelectItem value="INSTAGRAM">Instagram</SelectItem>
            <SelectItem value="X">X (Twitter)</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters} className="h-10 px-2 lg:px-3">
            Clear
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <LiveStreamsTable
        streams={streamsData?.data || []}
        isLoading={isLoading}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onRowClick={setSelectedStream}
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

      <LiveStreamDetailsDrawer
        stream={selectedStream}
        isOpen={!!selectedStream}
        onClose={() => setSelectedStream(null)}
      />
    </div>
  );
}
