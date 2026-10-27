'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { usePlatformPaymentDetails } from '@/hooks/use-admin';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  CreditCard,
  User,
  Building,
  DollarSign,
  Calendar,
  Activity,
  Receipt,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  Clock,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

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
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
    }).format(amount);
  };

  const copyToClipboard = (text: string, fieldId: string, successMessage = 'Copied to clipboard') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    toast.success(successMessage);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const renderStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Success
          </div>
        );
      case 'FAILED':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]">
            <AlertCircle className="w-3.5 h-3.5" />
            Failed
          </div>
        );
      case 'REFUNDED':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <RotateCcw className="w-3.5 h-3.5" />
            Refunded
          </div>
        );
      case 'PENDING':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </div>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {status || 'Unknown'}
          </Badge>
        );
    }
  };

  const renderGatewayBadge = (provider?: string) => {
    const gw = (provider || '').toUpperCase();
    if (gw === 'RAZORPAY') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold text-xs tracking-wide">
          <ShieldCheck className="w-3.5 h-3.5" />
          Razorpay
        </span>
      );
    }
    if (gw === 'STRIPE') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-semibold text-xs tracking-wide">
          <ShieldCheck className="w-3.5 h-3.5" />
          Stripe
        </span>
      );
    }
    return (
      <Badge variant="outline" className="text-xs">
        {provider || 'Direct'}
      </Badge>
    );
  };

  const statusGlowMap: Record<string, string> = {
    SUCCESS: 'bg-emerald-500/20',
    FAILED: 'bg-rose-500/20',
    REFUNDED: 'bg-purple-500/20',
    PENDING: 'bg-amber-500/20',
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg md:max-w-xl bg-background/95 backdrop-blur-2xl border-l border-border/50 p-0 flex flex-col shadow-2xl">
        {/* Sticky Header */}
        <div className="p-5 sm:p-6 border-b border-border/40 bg-card/40 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 pr-10">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent border border-primary/25 flex items-center justify-center text-primary shadow-inner shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Payment Details
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Audit ledger transaction & billing record
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-44 w-full rounded-2xl" />
              <div className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                </div>
              </div>
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ) : payment ? (
            <div className="space-y-6 pb-2">
              {/* Hero Receipt Card */}
              <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card/90 via-card/50 to-muted/20 p-5 sm:p-6 shadow-xl backdrop-blur-xl">
                {/* Ambient glow */}
                <div
                  className={cn(
                    'absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-25',
                    statusGlowMap[payment.status] || 'bg-primary/20'
                  )}
                />

                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-primary" />
                      Amount Paid
                    </span>
                    {renderStatusBadge(payment.status)}
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono">
                        {formatCurrency(payment.amount, payment.currency)}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted/60 text-muted-foreground uppercase">
                        {payment.currency || 'INR'}
                      </span>
                    </div>
                  </div>

                  {/* Quick-copy payment reference */}
                  <div className="pt-2">
                    <button
                      onClick={() => copyToClipboard(payment.reference, 'ref', 'Payment reference copied')}
                      type="button"
                      className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-background/70 hover:bg-background border border-border/50 text-xs font-mono text-muted-foreground hover:text-foreground transition-all group"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <CreditCard className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{payment.reference}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-sans font-medium text-primary shrink-0">
                        {copiedField === 'ref' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
                            <span>Copy Ref</span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Transaction Ledger Grid */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  Transaction Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Gateway / Provider */}
                  <div className="p-3.5 rounded-xl border border-border/50 bg-card/40 flex flex-col justify-between">
                    <span className="text-xs text-muted-foreground mb-1">Gateway Provider</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {renderGatewayBadge(payment.provider)}
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="p-3.5 rounded-xl border border-border/50 bg-card/40 flex flex-col justify-between">
                    <span className="text-xs text-muted-foreground mb-1">Payment Method</span>
                    <div className="flex items-center gap-1.5 font-medium text-sm text-foreground mt-0.5">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <span>{payment.paymentMethod || 'Card'}</span>
                    </div>
                  </div>

                  {/* Invoice / Order Reference */}
                  <div className="p-3.5 rounded-xl border border-border/50 bg-card/40 flex flex-col justify-between">
                    <span className="text-xs text-muted-foreground mb-1">Order Reference</span>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <span
                        className="font-mono text-xs font-semibold text-foreground truncate max-w-[180px]"
                        title={payment.invoiceReference || '—'}
                      >
                        {payment.invoiceReference || '—'}
                      </span>
                      {payment.invoiceReference && (
                        <button
                          onClick={() => copyToClipboard(payment.invoiceReference, 'invoice', 'Order reference copied')}
                          className="p-1 hover:text-primary text-muted-foreground rounded transition-colors"
                          title="Copy Order ID"
                        >
                          {copiedField === 'invoice' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="p-3.5 rounded-xl border border-border/50 bg-card/40 flex flex-col justify-between">
                    <span className="text-xs text-muted-foreground mb-1">Processed Date</span>
                    <div className="flex items-center gap-1.5 font-medium text-xs text-foreground mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">
                        {payment.createdAt
                          ? format(new Date(payment.createdAt), 'MMM dd, yyyy · hh:mm a')
                          : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Database Payment ID */}
                  <div className="sm:col-span-2 p-3.5 rounded-xl border border-border/50 bg-card/40 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs text-muted-foreground block">System Record ID</span>
                      <span
                        className="font-mono text-xs text-muted-foreground truncate block max-w-[240px] sm:max-w-[340px]"
                        title={payment.id}
                      >
                        {payment.id}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(payment.id, 'id', 'System ID copied')}
                      className="px-2.5 py-1.5 rounded-lg border border-border/60 hover:bg-muted text-xs font-medium flex items-center gap-1.5 text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                    >
                      {copiedField === 'id' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy ID</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Customer Profile Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <User className="w-3.5 h-3.5 text-primary" />
                  Customer Information
                </div>

                {payment.user ? (
                  <div className="p-4 rounded-xl border border-border/50 bg-card/40 hover:border-border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 text-primary-foreground font-bold flex items-center justify-center text-sm shadow-md ring-2 ring-primary/20 shrink-0">
                        {getInitials(payment.user.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{payment.user.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate mt-0.5">
                          <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{payment.user.email}</span>
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/admin/users/${payment.user.id}`}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 hover:border-primary/50 bg-muted/30 hover:bg-primary/10 text-xs font-medium text-primary transition-all shrink-0 self-start sm:self-center"
                    >
                      <span>View Profile</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-border/60 bg-muted/20 text-center text-xs text-muted-foreground">
                    No customer profile attached to this transaction.
                  </div>
                )}
              </div>

              {/* Workspace & Subscription Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Building className="w-3.5 h-3.5 text-primary" />
                  Workspace & Subscription
                </div>

                <div className="space-y-3">
                  {/* Workspace Card */}
                  {payment.workspace && (
                    <div className="p-3.5 rounded-xl border border-border/50 bg-card/40 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                          <Building className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] text-muted-foreground block">Workspace</span>
                          <span className="font-medium text-sm text-foreground truncate block">
                            {payment.workspace.name}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/admin/workspaces/${payment.workspace.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border/60 hover:border-primary/50 bg-muted/30 hover:bg-primary/10 text-xs font-medium text-primary transition-all shrink-0"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}

                  {/* Plan & Subscription Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {payment.plan && (
                      <div className="p-3.5 rounded-xl border border-border/50 bg-card/40 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] text-muted-foreground block">Plan Tier</span>
                          <span className="font-semibold text-sm text-foreground truncate block">
                            {payment.plan.name}
                          </span>
                        </div>
                      </div>
                    )}

                    {payment.subscription && (
                      <div className="p-3.5 rounded-xl border border-border/50 bg-card/40 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] text-muted-foreground block">Subscription Status</span>
                          <div className="mt-0.5">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold',
                                payment.subscription.status?.toUpperCase() === 'ACTIVE'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-muted text-muted-foreground border border-border'
                              )}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {payment.subscription.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
              <Receipt className="w-10 h-10 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium text-foreground">Payment Details Not Found</p>
              <p className="text-xs text-muted-foreground max-w-[260px]">
                The requested transaction record could not be loaded or may have been deleted.
              </p>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        {payment && (
          <div className="p-4 sm:p-5 border-t border-border/40 bg-card/60 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const summary = JSON.stringify(payment, null, 2);
                copyToClipboard(summary, 'json', 'Payment summary JSON copied');
              }}
              className="gap-1.5 text-xs border-border/60 hover:bg-muted"
            >
              {copiedField === 'json' ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span>Copy JSON</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs px-5 shadow-sm"
            >
              Done
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
