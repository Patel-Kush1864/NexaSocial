'use client';

import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format-currency';
import { SortableTableHead } from '@/components/admin/shared/sortable-table-head';

interface SubscriptionTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  isLoading: boolean;
  onViewDetails: (id: string) => void;
  onSort?: (field: string) => void;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export function SubscriptionTable({
  data,
  isLoading,
  onViewDetails,
  onSort,
  sortBy,
  sortOrder,
}: SubscriptionTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        Loading subscriptions...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border p-12 text-center">
        <h3 className="text-lg font-semibold">No Subscriptions</h3>
        <p className="text-sm text-muted-foreground mt-1">
          There are currently no platform subscriptions.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">● Active</Badge>;
      case 'TRIAL':
      case 'TRIALING':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">● Trialing</Badge>;
      case 'PAST_DUE':
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">● Past Due</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary">● Cancelled</Badge>;
      case 'EXPIRED':
        return <Badge variant="destructive">● Expired</Badge>;
      default:
        return <Badge variant="outline">● {status}</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Workspace Owner</TableHead>
            <SortableTableHead 
              label="Plan" 
              sortKey="plan" 
              currentSortBy={sortBy} 
              currentSortOrder={sortOrder} 
              onSort={onSort || (() => {})} 
            />
            <SortableTableHead 
              label="Status" 
              sortKey="status" 
              currentSortBy={sortBy} 
              currentSortOrder={sortOrder} 
              onSort={onSort || (() => {})} 
            />
            <SortableTableHead 
              label="Price" 
              sortKey="price" 
              currentSortBy={sortBy} 
              currentSortOrder={sortOrder} 
              onSort={onSort || (() => {})} 
            />
            <TableHead>Renewal</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((sub) => (
            <TableRow key={sub.id}>
              <TableCell>
                <div className="font-medium">{sub.workspace?.name || 'No Workspace'}</div>
                <div className="text-sm text-muted-foreground">
                  {sub.owner?.name} ({sub.owner?.email})
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{sub.plan?.name || 'Unknown Plan'}</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {sub.billingCycle?.toLowerCase()}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(sub.status)}</TableCell>
              <TableCell>
                {formatCurrency(sub.price, sub.currency)}
              </TableCell>
              <TableCell>
                {sub.nextRenewal ? format(new Date(sub.nextRenewal), 'dd MMM yyyy') : 'N/A'}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onViewDetails(sub.id)}>
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
