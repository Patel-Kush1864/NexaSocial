'use client';

import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { usePlatformPaymentDetails } from '@/hooks/use-admin';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { CreditCard, User, Building, LayoutTemplate, Link as LinkIcon, DollarSign, Calendar, Clock, RefreshCcw, Activity } from 'lucide-react';
import Link from 'next/link';

interface PaymentDetailsDrawerProps {
  paymentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentDetailsDrawer({
  paymentId,
  open,
  onOpenChange,
}: PaymentDetailsDrawerProps) {
  const { data: payment, isLoading } = usePlatformPaymentDetails(paymentId as string);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20';
      case 'FAILED':
        return 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20';
      case 'REFUNDED':
        return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20';
      case 'PENDING':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md w-[90vw] overflow-y-auto">
        <div className="flex flex-col space-y-2 text-center sm:text-left mb-6 mt-4">
          <h2 className="text-lg font-semibold text-foreground">
            Payment Details
          </h2>
          <p className="text-sm text-muted-foreground">
            View detailed payment and billing information.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        ) : payment ? (
          <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-2xl flex items-center gap-2">
                  {formatCurrency(payment.amount, payment.currency)}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  {payment.reference}
                </p>
              </div>
              <Badge variant="outline" className={getStatusColor(payment.status)}>
                {payment.status}
              </Badge>
            </div>

            <Separator />

            {/* Transaction */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                <Activity className="w-4 h-4" />
                Transaction
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Provider</p>
                  <p className="font-medium">{payment.provider}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <p className="font-medium">{payment.paymentMethod || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Invoice Reference</p>
                  <p className="font-medium">{payment.invoiceReference || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {payment.createdAt
                      ? format(new Date(payment.createdAt), 'PPP p')
                      : '—'}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Customer */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                <User className="w-4 h-4" />
                Customer
              </h4>
              <div className="grid grid-cols-1 gap-3 text-sm">
                {payment.user ? (
                  <div className="flex justify-between items-center bg-muted/40 p-3 rounded-md">
                    <div>
                      <p className="font-medium">{payment.user.name}</p>
                      <p className="text-muted-foreground text-xs">{payment.user.email}</p>
                    </div>
                    <Link href={`/admin/users/${payment.user.id}`} className="text-primary hover:underline flex items-center gap-1 text-xs">
                      <LinkIcon className="w-3 h-3" /> View
                    </Link>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No customer data available</p>
                )}
              </div>
            </div>

            {/* Workspace & Plan */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                <Building className="w-4 h-4" />
                Workspace & Plan
              </h4>
              <div className="space-y-3 text-sm">
                {payment.workspace ? (
                  <div className="flex justify-between items-center bg-muted/40 p-3 rounded-md">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Workspace</p>
                      <p className="font-medium">{payment.workspace.name}</p>
                    </div>
                    <Link href={`/admin/workspaces/${payment.workspace.id}`} className="text-primary hover:underline flex items-center gap-1 text-xs">
                      <LinkIcon className="w-3 h-3" /> View
                    </Link>
                  </div>
                ) : null}

                {payment.plan ? (
                  <div className="flex justify-between items-center bg-muted/40 p-3 rounded-md">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Plan</p>
                      <p className="font-medium">{payment.plan.name}</p>
                    </div>
                  </div>
                ) : null}

                {payment.subscription ? (
                  <div className="flex justify-between items-center bg-muted/40 p-3 rounded-md">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Subscription Status</p>
                      <Badge variant="outline" className="mt-1">
                        {payment.subscription.status}
                      </Badge>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            Payment details not found.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
