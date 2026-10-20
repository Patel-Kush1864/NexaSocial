import React from 'react';
import dayjs from 'dayjs';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { formatCurrency } from '@/lib/utils'; // Assuming this exists or similar

export function PaymentsTab({ data, isLoading }: { data: any, isLoading: boolean }) {
  if (isLoading) return <LoadingSpinner size="md" label="Loading payments..." />;
  
  const payments = data?.data || [];

  if (payments.length === 0) {
    return (
      <div className="text-center p-8 rounded-xl border border-border/50 glass-panel">
        <p className="text-muted-foreground">No payments found for this user.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 glass-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
            <tr>
              <th className="px-6 py-4 font-medium">Transaction ID</th>
              <th className="px-6 py-4 font-medium">Amount</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Plan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {payments.map((payment: any) => (
              <tr key={payment.id} className="hover:bg-secondary/10 transition-colors">
                <td className="px-6 py-4 font-medium text-xs font-mono">{payment.id}</td>
                <td className="px-6 py-4">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: payment.currency || 'INR' }).format(payment.amount)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    payment.status === 'PAID' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4">{dayjs(payment.created_at).format('MMM D, YYYY h:mm A')}</td>
                <td className="px-6 py-4">{payment.plan_name || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
