'use client';

import { useState } from 'react';
import { usePlatformPayments, useExportPlatformPayments } from '@/hooks/use-admin';
import { PageHeader } from '@/components/shared/page-header';
import { AdminPagination } from '@/components/admin/shared/admin-pagination';
import { SortableTableHead } from '@/components/admin/shared/sortable-table-head';
import { AdminTableToolbar, FilterConfig } from '@/components/admin/shared/admin-table-toolbar';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { PaymentStats } from '@/app/(dashboard)/payments/components/payment-stats';
import { PaymentDetailsDrawer } from '@/app/(dashboard)/payments/components/payment-details-drawer';
import { formatCurrency } from '@/lib/format-currency';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

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
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading } = usePlatformPayments({
    page,
    limit,
    search: search || undefined,
    status: status === 'ALL' || !status ? undefined : status,
    plan: plan === 'ALL' || !plan ? undefined : plan,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sortBy,
    sortOrder,
  });

  const exportMutation = useExportPlatformPayments();

  const payments = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
  const total = data?.pagination?.total ?? (data as any)?.meta?.total ?? payments.length;
  const totalPages = data?.pagination?.totalPages ?? (data as any)?.meta?.totalPages ?? (total > 0 ? Math.ceil(total / limit) : 0);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
    setPage(1);
  };

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleViewDetails = (id: string) => {
    setSelectedPaymentId(id);
    setDrawerOpen(true);
  };

  const handleExport = async () => {
    try {
      const blob = await exportMutation.mutateAsync({
        search: search || undefined,
        status: status === 'ALL' || !status ? undefined : status,
        plan: plan === 'ALL' || !plan ? undefined : plan,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Payment logs exported successfully');
    } catch {
      toast.error('Failed to export payment logs');
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st?.toUpperCase()) {
      case 'SUCCESS':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs font-medium">
            Success
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-xs font-medium">
            Failed
          </Badge>
        );
      case 'REFUNDED':
        return (
          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs font-medium">
            Refunded
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs font-medium">
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {st || 'Unknown'}
          </Badge>
        );
    }
  };

  const getGatewayBadge = (gateway?: string) => {
    const gw = (gateway || '').toUpperCase();
    if (gw === 'RAZORPAY') {
      return (
        <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/20 font-semibold text-xs tracking-wide">
          Razorpay
        </Badge>
      );
    }
    if (gw === 'STRIPE') {
      return (
        <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 font-semibold text-xs tracking-wide">
          Stripe
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs">
        {gateway || 'Direct'}
      </Badge>
    );
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
        { label: 'Starter Plan', value: 'Starter Plan' },
        { label: 'Pro Plan', value: 'Pro Plan' },
        { label: 'Enterprise Plan', value: 'Enterprise Plan' },
      ],
    },
    { id: 'dateFrom', type: 'date', placeholder: 'From Date' },
    { id: 'dateTo', type: 'date', placeholder: 'To Date' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Payment & Refund Monitoring"
          description="Audit Stripe and Razorpay transactions, gateways, and refund logs."
          badge={`${total} Total`}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exportMutation.isPending || payments.length === 0}
          className="gap-2 shrink-0 border-border/60 hover:bg-muted/50"
        >
          <Download className="h-4 w-4" />
          {exportMutation.isPending ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      <PaymentStats />

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
        searchPlaceholder="Search by Payment ID, reference, user, email..."
      />

      {isLoading ? (
        <LoadingSpinner size="lg" label="Loading transaction history..." />
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden glass-panel shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[200px]">Payment ID / Ref</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
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
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-sm text-muted-foreground">
                    No payment logs found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p: any) => {
                  const ref = p.reference || p.gatewayPaymentId || p.id;
                  const formattedDate = p.createdAt
                    ? format(new Date(p.createdAt), 'MMM dd, yyyy HH:mm')
                    : 'N/A';

                  return (
                    <TableRow
                      key={p.id}
                      onClick={() => handleViewDetails(p.id)}
                      className="hover:bg-accent/30 transition-colors text-sm cursor-pointer group"
                    >
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground text-xs">{ref}</span>
                          <button
                            onClick={(e) => handleCopy(ref, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-primary rounded"
                            title="Copy reference"
                          >
                            {copiedId === ref ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                        {ref !== p.id && (
                          <div className="text-[11px] text-muted-foreground truncate max-w-[170px]" title={p.id}>
                            ID: {p.id.slice(0, 8)}...
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground text-sm">
                            {p.user?.name || 'Unknown User'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {p.user?.email || 'N/A'}
                          </span>
                          {p.workspace?.name && (
                            <span className="text-[11px] text-primary/80 mt-0.5">
                              Workspace: {p.workspace.name}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-xs font-normal border-primary/20 bg-primary/5 text-primary">
                          {p.plan?.name || 'Pro Plan'}
                        </Badge>
                      </TableCell>

                      <TableCell>{getGatewayBadge(p.gateway || p.provider)}</TableCell>

                      <TableCell className="font-bold text-foreground">
                        {formatCurrency(p.amount, p.currency || 'INR')}
                      </TableCell>

                      <TableCell>{getStatusBadge(p.status)}</TableCell>

                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {formattedDate}
                      </TableCell>

                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(p.id)}
                          className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
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

      <PaymentDetailsDrawer
        paymentId={selectedPaymentId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
