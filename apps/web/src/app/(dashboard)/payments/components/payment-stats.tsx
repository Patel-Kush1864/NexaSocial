'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlatformPaymentStatistics } from '@/hooks/use-admin';
import { DollarSign, CheckCircle2, XCircle, RefreshCcw, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function PaymentStats() {
  const { data: stats, isLoading } = usePlatformPaymentStatistics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className={`border border-border/50 bg-card/50 backdrop-blur-sm ${i === 1 ? 'col-span-2 sm:col-span-1' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-24" />
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
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
      {/* Total Revenue */}
      <Card className="col-span-2 sm:col-span-1 border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm hover:border-emerald-500/30 transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <DollarSign className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">
            {formatCurrency(currentStats.totalRevenue.amount, currentStats.totalRevenue.currency)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Gross platform volume</p>
        </CardContent>
      </Card>

      {/* Successful */}
      <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm hover:border-emerald-500/30 transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Successful</CardTitle>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">
            {currentStats.successful.count.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 truncate">
            {formatCurrency(currentStats.successful.amount, currentStats.totalRevenue.currency)}
          </p>
        </CardContent>
      </Card>

      {/* Failed */}
      <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm hover:border-rose-500/30 transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Failed</CardTitle>
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">
            {currentStats.failed.count.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Requires review</p>
        </CardContent>
      </Card>

      {/* Refunded */}
      <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm hover:border-purple-500/30 transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Refunded</CardTitle>
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <RefreshCcw className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">
            {currentStats.refunded.count.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 truncate">
            {currentStats.refunded.amount > 0
              ? formatCurrency(currentStats.refunded.amount, currentStats.totalRevenue.currency)
              : '0 refunded'}
          </p>
        </CardContent>
      </Card>

      {/* Pending */}
      <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm hover:border-amber-500/30 transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pending</CardTitle>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">
            {currentStats.pending.count.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">In processing</p>
        </CardContent>
      </Card>
    </div>
  );
}
