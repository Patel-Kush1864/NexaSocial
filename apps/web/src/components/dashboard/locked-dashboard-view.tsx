/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscription.service';
import { useAuthStore } from '@/stores/auth-store';
import { launchRazorpayCheckout } from '@/lib/razorpay';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PricingPlans } from '@/components/pricing/pricing-plans';
import { toast } from 'sonner';
import { SubscriptionOnboardingScreen } from '@/components/onboarding/subscription-onboarding-screen';
import {
  Lock,
  CheckCircle2,
  Sparkles,
  Radio,
  Share2,
  BarChart3,
  Users,
  ShieldAlert,
  Clock,
  ArrowRight,
  Zap,
  HelpCircle,
  Loader2,
} from 'lucide-react';

interface LockedDashboardViewProps {
  status?: string;
  onRefreshEntitlements?: () => void;
  isWorkspaceOwner?: boolean;
  workspaceName?: string;
}

export function LockedDashboardView({
  status = 'NONE',
  onRefreshEntitlements,
  isWorkspaceOwner = true,
  workspaceName,
}: LockedDashboardViewProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch trusted plans from database
  const { data: plans = [], isLoading: isPlansLoading } = useQuery({
    queryKey: ['plans', 'public'],
    queryFn: () => subscriptionService.getPublicPlans(),
    staleTime: 1000 * 60 * 10,
  });

  // If user has not completed onboarding and has no workspace yet, show onboarding screen
  if (!workspaceName && (!status || status === 'NONE')) {
    return <SubscriptionOnboardingScreen />;
  }

  const handleCheckout = async (plan: any) => {
    setSelectedPlanId(plan.id);
    setIsProcessing(true);

    try {
      if (plan.price === 0 && plan.name === 'Free') {
        // Free plan checkout
        await subscriptionService.purchase(plan.id, 'FREE_PLAN_CHECKOUT');
        toast.success("Your subscription is active and your workspace is ready! Welcome to NexaSocial.");
        queryClient.invalidateQueries({ queryKey: ['subscriptions', 'entitlements'] });
        onRefreshEntitlements?.();
        return;
      }

      // Step 1: Create Order via Backend (retrieves plan price securely from database)
      toast.info('Initiating Razorpay Checkout...', {
        description: `Preparing order for ${plan.name} plan.`,
      });

      const orderData = await subscriptionService.createPaymentOrder(plan.id, 'RAZORPAY');

      // Step 2: Launch Razorpay Standard Checkout
      await launchRazorpayCheckout({
        keyId: orderData.keyId,
        orderId: orderData.gatewayOrderId,
        amount: Math.round(orderData.amount * 100),
        currency: orderData.currency || 'INR',
        planName: plan.name,
        userName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'NexaSocial User',
        userEmail: user?.email,
        onSuccess: async (paymentResult) => {
          toast.loading('Verifying payment signature with backend...', { id: 'payment-verify' });
          try {
            await subscriptionService.verifyPayment({
              gateway: 'RAZORPAY',
              gatewayOrderId: paymentResult.razorpay_order_id,
              gatewayPaymentId: paymentResult.razorpay_payment_id,
              gatewaySignature: paymentResult.razorpay_signature,
            });

            toast.success("Your subscription is active and your workspace is ready! Welcome to NexaSocial.", {
              id: 'payment-verify',
            });

            // Step 3: Refresh entitlement state to immediately unlock dashboard
            await queryClient.invalidateQueries({ queryKey: ['subscriptions', 'entitlements'] });
            await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            onRefreshEntitlements?.();
          } catch (verifyErr: any) {
            toast.error("Your payment could not be completed. Please try again or select another payment method.", {
              id: 'payment-verify',
            });
          }
        },
        onDismiss: () => {
          toast.info('Checkout cancelled', {
            description: 'You can restart subscription checkout whenever you are ready.',
          });
        },
        onError: (err) => {
          toast.error('Payment failed', {
            description: err?.description || 'Payment could not be processed. Please try again.',
          });
        },
      });
    } catch (err: any) {
      toast.error('Could not start checkout', {
        description: err?.response?.data?.message || err.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsProcessing(false);
      setSelectedPlanId(null);
    }
  };

  // Status banner helper
  const renderStatusBanner = () => {
    if (status === 'PENDING') {
      return (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-200">Payment Pending Verification</p>
              <p className="text-xs text-amber-300/80">
                Your payment is currently being confirmed. Features will unlock automatically once confirmed.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-500/40 text-amber-300 hover:bg-amber-500/20 text-xs h-8"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['subscriptions', 'entitlements'] });
              onRefreshEntitlements?.();
            }}
          >
            Check Status
          </Button>
        </div>
      );
    }

    if (status === 'FAILED') {
      return (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-rose-200">Previous Payment Attempt Failed</p>
              <p className="text-xs text-rose-300/80">
                Your last payment could not be processed. Please choose a plan below to retry via Razorpay.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (status === 'EXPIRED') {
      return (
        <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-violet-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-violet-200">Subscription Expired</p>
              <p className="text-xs text-violet-300/80">
                Your subscription has expired and premium features have been locked. Renew below to resume broadcasting!
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  if (!isWorkspaceOwner) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-zinc-950 border border-amber-500/30 p-8 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" />
              Workspace Subscription Inactive
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              This workspace does not currently have an active subscription
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              This workspace does not currently have an active subscription. Please contact the workspace owner.
            </p>

            <div className="p-4 rounded-xl bg-card/60 border border-border/40 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">What should you do?</p>
              <p>Please contact your workspace owner or administrator to activate or renew their NexaSocial subscription. Once updated, your access to broadcasts, social accounts, and AI tools will unlock automatically.</p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['subscriptions', 'entitlements'] });
                  onRefreshEntitlements?.();
                }}
              >
                <Clock className="w-3.5 h-3.5" />
                Check Subscription Status
              </Button>
            </div>
          </div>
        </div>

        {/* Locked Features Teaser Matrix */}
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            Workspace Features (Waiting for Workspace Owner Activation)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-border/40 bg-card/40 opacity-75 relative space-y-2">
              <div className="flex items-center justify-between">
                <Share2 className="w-5 h-5 text-violet-400" />
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <h4 className="font-bold text-sm">Social Connections</h4>
              <p className="text-xs text-muted-foreground">
                Connect YouTube, Facebook, Instagram, and X accounts.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border/40 bg-card/40 opacity-75 relative space-y-2">
              <div className="flex items-center justify-between">
                <Radio className="w-5 h-5 text-indigo-400" />
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <h4 className="font-bold text-sm">Live Broadcasts</h4>
              <p className="text-xs text-muted-foreground">
                Stream live to multiple social destinations with ultra-low latency relay.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border/40 bg-card/40 opacity-75 relative space-y-2">
              <div className="flex items-center justify-between">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <h4 className="font-bold text-sm">AI-Powered Tools</h4>
              <p className="text-xs text-muted-foreground">
                Generate captions, schedule viral posts, and analyze engagement trends.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border/40 bg-card/40 opacity-75 relative space-y-2">
              <div className="flex items-center justify-between">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <h4 className="font-bold text-sm">Audience Analytics</h4>
              <p className="text-xs text-muted-foreground">
                Cross-platform follower growth, stream view counts, and engagement heatmaps.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Status Alert if Pending / Expired / Failed */}
      {renderStatusBanner()}

      {/* Hero Welcome Locked Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950/80 via-slate-900/90 to-indigo-950/80 border border-violet-500/30 p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            Workspace Activation Required
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Welcome to <span className="gradient-text">NexaSocial</span>! Choose a subscription plan
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Welcome to NexaSocial! Choose a subscription plan to activate your workspace and access the features included in your plan.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 text-violet-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Razorpay Secured Checkout
            </span>
            <span className="flex items-center gap-1.5 text-violet-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant Plan Activation
            </span>
            <span className="flex items-center gap-1.5 text-violet-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cancel Anytime
            </span>
          </div>
        </div>
      </div>

      {/* Official Subscription Plans and Comparison Matrix */}
      <PricingPlans
        showComparison={true}
        onPlanPurchased={onRefreshEntitlements}
      />

      {/* Locked Features Teaser Matrix */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Lock className="w-4 h-4 text-violet-400" />
          Locked Platform Features (Requires Active Subscription)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-border/40 bg-card/40 opacity-75 relative space-y-2">
            <div className="flex items-center justify-between">
              <Share2 className="w-5 h-5 text-violet-400" />
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <h4 className="font-bold text-sm">Social Connections</h4>
            <p className="text-xs text-muted-foreground">
              Connect YouTube, Facebook, Instagram, and X accounts.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/40 bg-card/40 opacity-75 relative space-y-2">
            <div className="flex items-center justify-between">
              <Radio className="w-5 h-5 text-indigo-400" />
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <h4 className="font-bold text-sm">Live Broadcasts</h4>
            <p className="text-xs text-muted-foreground">
              Stream live to multiple social destinations with ultra-low latency relay.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/40 bg-card/40 opacity-75 relative space-y-2">
            <div className="flex items-center justify-between">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <h4 className="font-bold text-sm">AI-Powered Tools</h4>
            <p className="text-xs text-muted-foreground">
              Generate captions, schedule viral posts, and analyze engagement trends.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/40 bg-card/40 opacity-75 relative space-y-2">
            <div className="flex items-center justify-between">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <h4 className="font-bold text-sm">Audience Analytics</h4>
            <p className="text-xs text-muted-foreground">
              Cross-platform follower growth, stream view counts, and engagement heatmaps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
