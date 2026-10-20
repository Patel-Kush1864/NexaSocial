'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Eye, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface PaymentTableProps {
  payments: any[];
  isLoading: boolean;
  onViewPayment: (id: string) => void;
  onSort: (column: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function PaymentTable({
  payments,
  isLoading,
  onViewPayment,
  onSort,
  sortBy,
  sortOrder,
}: PaymentTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'FAILED':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'REFUNDED':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'PENDING':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
    }).format(amount);
  };

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1" />
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Workspace</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="rounded-md border p-12 text-center">
        <h3 className="text-lg font-medium text-foreground">No payments found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Payments matching your current filters will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Payment</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Workspace</TableHead>
            <TableHead 
              className="cursor-pointer select-none" 
              onClick={() => onSort('amount')}
            >
              <div className="flex items-center">
                Amount
                {renderSortIcon('amount')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer select-none" 
              onClick={() => onSort('status')}
            >
              <div className="flex items-center">
                Status
                {renderSortIcon('status')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer select-none" 
              onClick={() => onSort('createdAt')}
            >
              <div className="flex items-center">
                Date
                {renderSortIcon('createdAt')}
              </div>
            </TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                <div className="font-medium text-sm">{payment.reference}</div>
                <div className="text-xs text-muted-foreground">
                  {payment.provider}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium text-sm">
                  {payment.user?.name || '—'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {payment.user?.email}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium text-sm">
                  {payment.workspace?.name || '—'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {payment.plan?.name || '—'}
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrency(payment.amount, payment.currency)}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusColor(payment.status)}>
                  {payment.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {format(new Date(payment.createdAt), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewPayment(payment.id)}
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
