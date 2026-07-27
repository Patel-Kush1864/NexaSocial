'use client';

import { useAdminPayments } from '@/hooks/use-admin';
import { PageHeader } from '@/components/shared/page-header';
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
  const { data, isLoading } = useAdminPayments();

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading transaction history..." />;
  }

  const payments = data?.data || [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Payment & Refund Monitoring"
        description="Audit Stripe and Razorpay transactions, gateways, and refund logs."
      />

      <div className="rounded-xl border border-border/50 overflow-hidden glass-panel">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Payment ID</TableHead>
              <TableHead>Gateway</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
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
              payments.map((p) => (
                <TableRow key={p.id} className="hover:bg-accent/30 transition-colors text-xs">
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
    </div>
  );
}
