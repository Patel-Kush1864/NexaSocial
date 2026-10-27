/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { CreateWorkspaceDialog } from '@/components/dialogs/create-workspace-dialog';
import { workspaceService } from '@/services/workspace.service';
import { useWorkspaceStore } from '@/stores/workspace-store';
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
  Sparkles,
} from 'lucide-react';

export function BillingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  const {
    entitlements,
    hasActiveSubscription,
    status,
    planName,
    planPrice,
    isWorkspaceOwner,
    workspaceName,
    workspaceRole,
    isLoading: isEntitlementsLoading,
    refetch: refetchEntitlements,
  } = useSubscriptionEntitlements();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);

  const canManageBilling = isWorkspaceOwner || hasPermission('billing.manage') || hasPermission('billing.view');

  // Fetch trusted plans from database
  const { data: plans = [], isLoading: isPlansLoading } = useQuery({
    queryKey: ['plans', 'public'],
    queryFn: () => subscriptionService.getPublicPlans(),
    staleTime: 1000 * 60 * 10,
  });

  // Fetch real payment history (only for workspace owner or members with billing permissions)
  const { data: payments = [], isLoading: isPaymentsLoading, refetch: refetchPayments } = useQuery({
    queryKey: ['payments', 'history'],
    queryFn: () => subscriptionService.getPaymentHistory(),
    enabled: !!canManageBilling,
    staleTime: 1000 * 60 * 2,
  });

  const handlePostPaymentFlow = async () => {
    await queryClient.invalidateQueries({ queryKey: ['subscriptions', 'entitlements'] });
    await queryClient.invalidateQueries({ queryKey: ['payments', 'history'] });
    await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    await refetchEntitlements();
    await refetchPayments();

    try {
      const freshWorkspaces = await workspaceService.getAll();
      if (freshWorkspaces && freshWorkspaces.length > 0) {
        useWorkspaceStore.getState().setWorkspaces(freshWorkspaces);
        useWorkspaceStore.getState().setCurrentWorkspace(freshWorkspaces[0]);
        router.push('/dashboard');
      } else {
        toast.success('Subscription activated successfully!', {
          description: 'Now, create your workspace to get started with NexaSocial.',
        });
        router.push('/workspaces/create');
      }
    } catch {
      router.push('/workspaces/create');
    }
  };

  const handleCheckout = async (plan: any) => {
    setSelectedPlanId(plan.id);
    setIsProcessing(true);

    try {
      if (plan.price === 0 && plan.name === 'Free') {
        await subscriptionService.purchase(plan.id, 'FREE_PLAN_CHECKOUT');
        toast.success("Your subscription is active and your workspace is ready! Welcome to NexaSocial.");
        await handlePostPaymentFlow();
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

            toast.success("Your subscription is active and your workspace is ready! Welcome to NexaSocial.", {
              id: 'billing-verify',
            });

            await handlePostPaymentFlow();
          } catch {
            toast.error("Your payment could not be completed. Please try again or select another payment method.", {
              id: 'billing-verify',
            });
          }
        },
        onDismiss: () => {
          toast.info('Payment was cancelled. You can select another plan or retry at any time.');
        },
        onError: () => {
          toast.error("Your payment could not be completed. Please try again or select another payment method.");
        },
      });
    } catch {
      toast.error("Your payment could not be completed. Please try again or select another payment method.");
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

      {/* Onboarding Welcome Card for New Owners Before Purchase */}
      {!hasActiveSubscription && (!currentWorkspace || !entitlements?.workspaceId) ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950/80 via-slate-900/90 to-indigo-950/80 border border-violet-500/30 p-8 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Getting Started</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome to NexaSocial!
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Your account has been created successfully. Choose a subscription plan to continue. After your subscription is successfully activated, you can create your workspace and start using NexaSocial.
            </p>
            <div className="pt-2">
              <Button
                id="btn-choose-plan-hero"
                onClick={() => {
                  const el = document.getElementById('pricing-plans-section');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }
                }}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-violet-600/25 flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Choose Subscription Plan</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Current Active Plan Overview for users with an existing workspace */
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
                    {!isWorkspaceOwner && (
                      <Badge variant="outline" className="text-xs border-violet-500/40 text-violet-300">
                        Workspace Plan ({workspaceRole || 'Member'})
                      </Badge>
                    )}
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 text-amber-400" />
                    <h3 className="text-lg font-bold text-white">
                      {isWorkspaceOwner ? 'No Active Subscription' : 'Workspace Subscription Inactive'}
                    </h3>
                    <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs">
                      LOCKED ({status})
                    </Badge>
                  </>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                {hasActiveSubscription
                  ? isWorkspaceOwner
                    ? entitlements?.endDate
                      ? `Subscription active through ${new Date(entitlements.endDate).toLocaleDateString()}. Features unlocked.`
                      : 'Unlimited active subscription. Features unlocked.'
                    : `This workspace subscription is managed by the workspace owner. Your account permissions (${workspaceRole || 'Member'}) inherit this plan.`
                  : isWorkspaceOwner
                    ? 'Main NexaSocial features are locked. Select an official subscription plan below to unlock broadcasting and AI tools.'
                    : `The workspace ${workspaceName ? `"${workspaceName}"` : ''} does not have an active plan. Please contact the workspace owner to activate or renew the subscription.`}
              </p>
            </div>

          <div className="flex items-center gap-4">
            {hasActiveSubscription ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-white">
                  ₹{planPrice.toLocaleString()}/mo
                </span>
                {isWorkspaceOwner && status !== 'CANCELLED' && (
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
                {isWorkspaceOwner ? 'Access Locked' : 'Waiting on Owner'}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Plans Pricing Cards and Comparison Matrix */}
      {isWorkspaceOwner ? (
        <PricingPlans
          showComparison={true}
          onPlanPurchased={handlePostPaymentFlow}
        />
      ) : (
        <Card className="glass-panel border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-lg font-bold">Workspace Plan Details</CardTitle>
            <CardDescription className="text-xs max-w-lg mx-auto">
              Plan selection, upgrades, and billing details are managed exclusively by the workspace owner. Your team member role ({workspaceRole || 'MEMBER'}) uses the workspace&apos;s allocated feature limits.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Payment History Table - Only visible to workspace owner or members with billing permissions */}
      {canManageBilling && (
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
      )}

      <CreateWorkspaceDialog
        open={isCreateWorkspaceOpen}
        onOpenChange={setIsCreateWorkspaceOpen}
        onSuccess={() => {
          router.push('/dashboard');
        }}
      />
    </div>
  );
}

export default BillingPage;
