'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ActivityRow } from '@/components/admin/activity-row';
import { ActivityDetailsDrawer } from '@/components/admin/activity-details-drawer';
import { usePlatformActivity } from '@/hooks/use-platform-activity';
import { Activity, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PlatformActivity } from '@/types';
import { AdminPagination } from '@/components/admin/shared/admin-pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = [
  { id: 'ALL', label: 'All' },
  { id: 'USER', label: 'Users' },
  { id: 'WORKSPACE', label: 'Workspaces' },
  { id: 'PAYMENT', label: 'Payments' },
  { id: 'SUBSCRIPTION', label: 'Subscriptions' },
  { id: 'SOCIAL', label: 'Social' },
  { id: 'STREAM', label: 'Streams' },
  { id: 'NOTIFICATIONS', label: 'Notifications' },
];

export default function PlatformActivityPage() {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [selectedActivity, setSelectedActivity] = useState<PlatformActivity | null>(null);
  
  const [limit, setLimit] = useState(20);

  const { data: responseData, isLoading, isError, refetch, isFetching } = usePlatformActivity({
    category: activeCategory,
    page,
    limit,
    search: search.length > 2 ? search : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sortBy,
    sortOrder,
  });

  const activities = responseData?.data || [];
  const pagination = responseData?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setPage(1); // Reset to page 1 on category change
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Activity</h1>
          <p className="text-muted-foreground text-sm">
            Complete audit trail of all platform-wide events and actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching || isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="glass-panel border-border/50">
        <div className="px-6 py-4 border-b border-border/20 space-y-4">
          {/* Category Filters */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-md transition-colors ${activeCategory === cat.id
                    ? 'bg-foreground text-background'
                    : 'bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search activity..."
                className="pl-9 w-full bg-accent/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary/50"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                type="date"
                className="w-full sm:w-36 bg-accent/50"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="date"
                className="w-full sm:w-36 bg-accent/50"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={sortBy} onValueChange={(v) => { setSortBy(v || 'createdAt'); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-32 bg-accent/50">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date</SelectItem>
                  <SelectItem value="action">Action</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(v: string | null) => { setSortOrder((v as 'ASC' | 'DESC') || 'DESC'); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-28 bg-accent/50">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DESC">Newest</SelectItem>
                  <SelectItem value="ASC">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {isError ? (
            <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-rose-500" />
              <div>
                <h3 className="font-semibold text-lg">Unable to load platform activity.</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mt-1">
                  There was a problem fetching the activity logs. Please try again.
                </p>
              </div>
              <Button onClick={() => refetch()} disabled={isFetching} className="mt-2">
                <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                Retry Connection
              </Button>
            </div>
          ) : (isLoading && activities.length === 0) ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-3 mt-1">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="p-16 text-center text-muted-foreground flex flex-col items-center">
              <Activity className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-medium text-foreground">No activities found</p>
              <p className="text-sm mt-1">
                {activeCategory !== 'ALL'
                  ? `No ${CATEGORIES.find(c => c.id === activeCategory)?.label.toLowerCase()} activity found.`
                  : 'There are no activities to display yet.'}
              </p>
              {activeCategory !== 'ALL' && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => handleCategoryChange('ALL')}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              {activities.map((activity) => (
                <ActivityRow key={activity.id} activity={activity} onClick={() => setSelectedActivity(activity)} />
              ))}
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {activities.length > 0 && (
          <AdminPagination
            page={page}
            limit={limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        )}
      </Card>

      <ActivityDetailsDrawer 
        activity={selectedActivity} 
        isOpen={!!selectedActivity} 
        onClose={() => setSelectedActivity(null)} 
      />
    </div>
  );
}
