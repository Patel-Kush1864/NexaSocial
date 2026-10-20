'use client';

import { useState } from 'react';
import { usePlatformPayments } from '@/hooks/use-admin';
import { PageHeader } from '@/components/shared/page-header';
import { AdminPagination } from '@/components/admin/shared/admin-pagination';
import { SortableTableHead } from '@/components/admin/shared/sortable-table-head';
import { AdminTableToolbar, FilterConfig } from '@/components/admin/shared/admin-table-toolbar';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [plan, setPlan] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const { data, isLoading } = usePlatformPayments({ page, limit, search, status, plan, dateFrom, dateTo, sortBy, sortOrder });

  const payments = data?.data || [];
  const total = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.totalPages || 0;

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
    setPage(1);
  };

  const filters: FilterConfig[] = [
    { id: 'search', type: 'search' },
    {
      id: 'status',
      type: 'select',
      placeholder: 'All Statuses',
      options: [
        { label: 'Success', value: 'SUCCESS' },
        { label: 'Failed', value: 'FAILED' },
        { label: 'Pending', value: 'PENDING' },
        { label: 'Refunded', value: 'REFUNDED' },
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
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Payment & Refund Monitoring"
        description="Audit Stripe and Razorpay transactions, gateways, and refund logs."
        badge={`${total} Total`}
      />

      <AdminTableToolbar
        search={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        filters={filters}
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
        searchPlaceholder="Search by Payment ID or Email..."
      />

      {isLoading ? (
        <LoadingSpinner size="lg" label="Loading transaction history..." />
      ) : (

      <div className="rounded-xl border border-border/50 overflow-hidden glass-panel">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Payment ID</TableHead>
              <TableHead>Gateway</TableHead>
              <SortableTableHead 
                label="Amount" 
                sortKey="amount" 
                currentSortBy={sortBy} 
                currentSortOrder={sortOrder} 
                onSort={handleSort} 
              />
              <SortableTableHead 
                label="Status" 
                sortKey="status" 
                currentSortBy={sortBy} 
                currentSortOrder={sortOrder} 
                onSort={handleSort} 
              />
              <SortableTableHead 
                label="Date" 
                sortKey="createdAt" 
                currentSortBy={sortBy} 
                currentSortOrder={sortOrder} 
                onSort={handleSort} 
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                  No payment logs found in system.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p: any) => (
                <TableRow key={p.id} className="hover:bg-accent/30 transition-colors text-sm">
                  <TableCell className="font-mono">{p.id}</TableCell>
                  <TableCell className="font-semibold">{p.gateway}</TableCell>
                  <TableCell className="font-bold">${p.amount}</TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.createdAt}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      )}

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
  );
}
