/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscription.service';
import { useSubscriptionEntitlements } from '@/hooks/use-entitlements';
import { useAuthStore } from '@/stores/auth-store';
import { launchRazorpayCheckout } from '@/lib/razorpay';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { PricingPlans } from '@/components/pricing/pricing-plans';
import { toast } from 'sonner';
import {
  CreditCard,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Zap,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';

export function BillingPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const {
    entitlements,
    hasActiveSubscription,
    status,
    planName,
    planPrice,
    isLoading: isEntitlementsLoading,
    refetch: refetchEntitlements,
  } = useSubscriptionEntitlements();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch trusted plans from database
  const { data: plans = [], isLoading: isPlansLoading } = useQuery({
    queryKey: ['plans', 'public'],
    queryFn: () => subscriptionService.getPublicPlans(),
    staleTime: 1000 * 60 * 10,
  });

  // Fetch real payment history
  const { data: payments = [], isLoading: isPaymentsLoading, refetch: refetchPayments } = useQuery({
    queryKey: ['payments', 'history'],
    queryFn: () => subscriptionService.getPaymentHistory(),
    staleTime: 1000 * 60 * 2,
  });

  const handleCheckout = async (plan: any) => {
    setSelectedPlanId(plan.id);
    setIsProcessing(true);

    try {
      if (plan.price === 0 && plan.name === 'Free') {
        await subscriptionService.purchase(plan.id, 'FREE_PLAN_CHECKOUT');
        toast.success('Free plan activated!');
        await queryClient.invalidateQueries({ queryKey: ['subscriptions', 'entitlements'] });
        await refetchEntitlements();
        return;
      }

      toast.info('Starting Razorpay Checkout...', {
        description: `Order amount: ₹${Number(plan.price).toLocaleString()} for ${plan.name}.`,
      });

      const orderData = await subscriptionService.createPaymentOrder(plan.id, 'RAZORPAY');

      await launchRazorpayCheckout({
        keyId: orderData.keyId,
        orderId: orderData.gatewayOrderId,
        amount: Math.round(orderData.amount * 100),
        currency: orderData.currency || 'INR',
        planName: plan.name,
        userName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'NexaSocial User',
        userEmail: user?.email,
        onSuccess: async (paymentResult) => {
          toast.loading('Verifying payment signature with backend...', { id: 'billing-verify' });
          try {
            await subscriptionService.verifyPayment({
              gateway: 'RAZORPAY',
              gatewayOrderId: paymentResult.razorpay_order_id,
              gatewayPaymentId: paymentResult.razorpay_payment_id,
              gatewaySignature: paymentResult.razorpay_signature,
            });

            toast.success('Payment verified! Subscription unlocked.', {
              id: 'billing-verify',
              description: `You are now subscribed to ${plan.name}.`,
            });

            await queryClient.invalidateQueries({ queryKey: ['subscriptions', 'entitlements'] });
            await queryClient.invalidateQueries({ queryKey: ['payments', 'history'] });
            refetchEntitlements();
            refetchPayments();
          } catch (verifyErr: any) {
            toast.error('Payment verification failed', {
              id: 'billing-verify',
              description: verifyErr?.response?.data?.message || 'Verification could not be completed.',
            });
          }
        },
        onDismiss: () => {
          toast.info('Checkout cancelled');
        },
        onError: (err) => {
          toast.error('Payment failed', {
            description: err?.description || 'Could not complete payment transaction.',
          });
        },
      });
    } catch (err: any) {
      toast.error('Could not initiate checkout', {
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setIsProcessing(false);
      setSelectedPlanId(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your current subscription? It will remain accessible until the end of your billing cycle.')) {
      return;
    }
    setIsCancelling(true);
    try {
      await subscriptionService.cancel();
      toast.success('Subscription cancelled successfully', {
        description: 'You will retain access until the end of the current billing period.',
      });
      await queryClient.invalidateQueries({ queryKey: ['subscriptions', 'entitlements'] });
      refetchEntitlements();
    } catch (err: any) {
      toast.error('Could not cancel subscription', {
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (isEntitlementsLoading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading billing details..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-300">
      <PageHeader
        title="Billing & Subscription"
        description="Manage your subscription tier, billing interval, and view payment receipts."
      />

      {/* Current Active Plan Overview */}
      <Card
        className={`glass-panel border-border/50 ${hasActiveSubscription
            ? 'bg-gradient-to-r from-violet-950/40 via-indigo-950/30 to-background border-violet-500/30'
            : 'bg-gradient-to-r from-amber-950/20 via-background to-background border-amber-500/30'
          }`}
      >
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {hasActiveSubscription ? (
                <>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-white">
                    {planName || 'Active'} Plan
                  </h3>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                    {status}
                  </Badge>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-white">No Active Subscription</h3>
                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs">
                    LOCKED ({status})
                  </Badge>
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {hasActiveSubscription
                ? entitlements?.endDate
                  ? `Subscription active through ${new Date(entitlements.endDate).toLocaleDateString()}. Features unlocked.`
                  : 'Unlimited active subscription. Features unlocked.'
                : 'Main NexaSocial features are locked. Select an official subscription plan below to unlock broadcasting and AI tools.'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {hasActiveSubscription ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-white">
                  ₹{planPrice.toLocaleString()}/mo
                </span>
                {status !== 'CANCELLED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs"
                    onClick={handleCancelSubscription}
                    disabled={isCancelling}
                  >
                    {isCancelling ? 'Cancelling...' : 'Cancel'}
                  </Button>
                )}
              </div>
            ) : (
              <Badge variant="outline" className="border-amber-500/40 text-amber-300 px-3 py-1">
                Access Locked
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plans Pricing Cards and Comparison Matrix */}
      <PricingPlans
        showComparison={true}
        onPlanPurchased={async () => {
          await queryClient.invalidateQueries({ queryKey: ['subscriptions', 'entitlements'] });
          await queryClient.invalidateQueries({ queryKey: ['payments', 'history'] });
          refetchEntitlements();
          refetchPayments();
        }}
      />

      {/* Payment History Table */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-violet-400" />
              Payment History & Razorpay Receipts
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {payments.length} Records
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Review your historical transactions, statuses, and payment provider references.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPaymentsLoading ? (
            <div className="py-6 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">No Payment History</p>
              <p>Your payment receipts will appear here after purchasing a subscription.</p>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {payments.map((p: any) => {
                const isSuccess = p.status === 'SUCCESS' || p.status === 'COMPLETED';
                const isPending = p.status === 'PENDING';

                return (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-accent/20 border border-border/30 gap-3"
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-foreground flex items-center gap-2">
                        <span>{p.gatewayOrderId || p.id}</span>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {p.gateway || 'RAZORPAY'}
                        </Badge>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {p.created_at ? new Date(p.created_at).toLocaleString() : 'Recent'}
                        {p.plan?.name && ` • Plan: ${p.plan.name}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-bold text-sm text-foreground">
                        ₹{Number(p.amount).toLocaleString()}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${isSuccess
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : isPending
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default BillingPage;
