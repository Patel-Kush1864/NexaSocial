'use client';


import { useRouter, useSearchParams } from 'next/navigation';
import { usePlatformPayments, useExportPlatformPayments } from '@/hooks/use-admin';
import { PaymentStats } from './components/payment-stats';
import { PaymentTable } from './components/payment-table';
import { PaymentDetailsDrawer } from './components/payment-details-drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import * as React from 'react';

function useDebounce<T>(value: T, delay: number): [T] {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return [debouncedValue];
}
export default function PaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [page, setPage] = React.useState(Number(searchParams.get('page')) || 1);
  const [limit, setLimit] = React.useState(Number(searchParams.get('limit')) || 20);
  const [status, setStatus] = React.useState(searchParams.get('status') || 'ALL');
  const [searchInput, setSearchInput] = React.useState(searchParams.get('search') || '');
  const [searchQuery] = useDebounce(searchInput, 500);
  
  const [sortBy, setSortBy] = React.useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>((searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc');

  const [selectedPaymentId, setSelectedPaymentId] = React.useState<string | null>(null);

  const queryParams = {
    page,
    limit,
    ...(status !== 'ALL' && { status }),
    ...(searchQuery && { search: searchQuery }),
    sortBy,
    sortOrder,
  };

  const { data: paymentsData, isLoading, isError } = usePlatformPayments(queryParams);
  const exportMutation = useExportPlatformPayments();

  // Update URL on filter change
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (limit !== 20) params.set('limit', limit.toString());
    if (status !== 'ALL') params.set('status', status);
    if (searchQuery) params.set('search', searchQuery);
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);

    const search = params.toString();
    const query = search ? `?${search}` : '';
    
    // Avoid unneeded pushes
    const currentQuery = Array.from(searchParams.entries()).map(([k, v]) => `${k}=${v}`).sort().join('&');
    const newQuery = Array.from(params.entries()).map(([k, v]) => `${k}=${v}`).sort().join('&');
    
    if (currentQuery !== newQuery) {
      router.push(`/payments${query}`, { scroll: false });
    }
  }, [page, limit, status, searchQuery, sortBy, sortOrder, router, searchParams]);

  const handleExport = async () => {
    try {
      const blob = await exportMutation.mutateAsync({
        ...(status !== 'ALL' && { status }),
        ...(searchQuery && { search: searchQuery }),
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Export successful', {
        description: 'Payment data has been exported successfully.',
      });
    } catch (error) {
      toast.error('Export failed', {
        description: 'Failed to export payment data.',
      });
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1); // Reset to page 1 on sort change
  };

  const handleResetFilters = () => {
    setStatus('ALL');
    setSearchInput('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  const hasActiveFilters = status !== 'ALL' || searchInput.length > 0;

  if (isError) {
    return (
      <div className="p-8 border rounded-xl bg-accent/20 flex flex-col items-center justify-center text-center space-y-4">
        <h3 className="font-semibold text-lg text-rose-500">Failed to load payments</h3>
        <p className="text-sm text-muted-foreground">Please check your permissions or network connection.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage platform payments across NexaSocial.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleExport}
          disabled={exportMutation.isPending || isLoading}
        >
          <Download className="w-4 h-4 mr-2" />
          {exportMutation.isPending ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      <PaymentStats />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payments..."
            className="pl-9 pr-8"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <Select 
          value={status} 
          onValueChange={(val) => {
            setStatus(val || 'ALL');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="SUCCESS">Successful</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={handleResetFilters} className="text-muted-foreground px-2">
            Reset
          </Button>
        )}
      </div>

      <PaymentTable 
        payments={paymentsData?.data || []}
        isLoading={isLoading}
        onViewPayment={setSelectedPaymentId}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />

      {/* Pagination */}
      {!isLoading && paymentsData?.meta && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, paymentsData.meta.total)} of {paymentsData.meta.total} payments
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= paymentsData.meta.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <PaymentDetailsDrawer
        paymentId={selectedPaymentId}
        open={!!selectedPaymentId}
        onOpenChange={(open) => !open && setSelectedPaymentId(null)}
      />
    </div>
  );
}
