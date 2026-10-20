'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlatformPaymentStatistics } from '@/hooks/use-admin';
import { DollarSign, CheckCircle, XCircle, RefreshCcw, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function PaymentStats() {
  const { data: stats, isLoading } = usePlatformPaymentStatistics();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const defaultStats = {
    totalRevenue: { amount: 0, currency: 'INR' },
    successful: { count: 0, amount: 0 },
    failed: { count: 0, amount: 0 },
    refunded: { count: 0, amount: 0 },
    pending: { count: 0, amount: 0 },
  };

  const currentStats = stats || defaultStats;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(currentStats.totalRevenue.amount, currentStats.totalRevenue.currency)}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Successful</CardTitle>
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentStats.successful.count.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(currentStats.successful.amount, currentStats.totalRevenue.currency)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Failed</CardTitle>
          <XCircle className="h-4 w-4 text-rose-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentStats.failed.count.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Refunded</CardTitle>
          <RefreshCcw className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentStats.refunded.count.toLocaleString()}</div>
          {currentStats.refunded.amount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(currentStats.refunded.amount, currentStats.totalRevenue.currency)}
            </p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentStats.pending.count.toLocaleString()}</div>
        </CardContent>
      </Card>
    </div>
  );
}
