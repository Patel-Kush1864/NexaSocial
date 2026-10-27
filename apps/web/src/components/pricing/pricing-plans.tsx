'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscription.service';
import { useSubscriptionEntitlements } from '@/hooks/use-entitlements';
import { useAuthStore } from '@/stores/auth-store';
import { launchRazorpayCheckout } from '@/lib/razorpay';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Check,
  X,
  Sparkles,
  Zap,
  ArrowRight,
  Loader2,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';

interface PricingPlansProps {
  showComparison?: boolean;
  onPlanPurchased?: () => void;
  className?: string;
  isPublicView?: boolean;
}

export function PricingPlans({
  showComparison = true,
  onPlanPurchased,
  className = '',
  isPublicView = false,
}: PricingPlansProps) {
  const { user, isAuthenticated } = useAuthStore();
  const {
    entitlements,
    hasActiveSubscription,
    planName: currentPlanName,
    refetch: refetchEntitlements,
  } = useSubscriptionEntitlements();

  const [billingFilter, setBillingFilter] = useState<'ALL' | 'MONTHLY' | 'YEARLY'>('ALL');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch verified active plans directly from backend API
  const {
    data: plans = [],
    isLoading,
    isError,
    error,
    refetch: refetchPlans,
  } = useQuery({
    queryKey: ['plans', 'public'],
    queryFn: () => subscriptionService.getPublicPlans(),
    staleTime: 1000 * 60 * 5,
  });

  const handleCheckout = async (plan: any) => {
    // If not logged in and in public view, route to register
    if (!isAuthenticated && isPublicView) {
      window.location.href = `/register?plan=${plan.code || plan.id}`;
      return;
    }

    setSelectedPlanId(plan.id);
    setIsProcessing(true);

    try {
      if (Number(plan.price) === 0) {
        // Free tier checkout
        await subscriptionService.purchase(plan.id, 'FREE_PLAN_CHECKOUT');
        toast.success("Your subscription is active and your workspace is ready! Welcome to NexaSocial.");
        await refetchEntitlements();
        onPlanPurchased?.();
        return;
      }

      toast.info('Initiating Razorpay Checkout...', {
        description: `Preparing order for ₹${Number(plan.price).toLocaleString()} (${plan.name} plan).`,
      });

      // 1. Create order securely on backend with database-authoritative price
      const orderData = await subscriptionService.createPaymentOrder(plan.id, 'RAZORPAY');

      // 2. Launch Razorpay Checkout modal
      await launchRazorpayCheckout({
        keyId: orderData.keyId,
        orderId: orderData.gatewayOrderId,
        amount: Math.round(orderData.amount * 100),
        currency: orderData.currency || plan.currency || 'INR',
        planName: plan.name,
        userName: user?.firstName
          ? `${user.firstName} ${user.lastName || ''}`.trim()
          : 'NexaSocial User',
        userEmail: user?.email,
        onSuccess: async (paymentResult) => {
          toast.loading('Verifying payment signature with backend...', { id: 'pricing-verify' });
          try {
            await subscriptionService.verifyPayment({
              gateway: 'RAZORPAY',
              gatewayOrderId: paymentResult.razorpay_order_id,
              gatewayPaymentId: paymentResult.razorpay_payment_id,
              gatewaySignature: paymentResult.razorpay_signature,
            });

            toast.success("Your subscription is active and your workspace is ready! Welcome to NexaSocial.", {
              id: 'pricing-verify',
            });

            await refetchEntitlements();
            onPlanPurchased?.();
          } catch (verifyErr: any) {
            toast.error("Your payment could not be completed. Please try again or select another payment method.", {
              id: 'pricing-verify',
            });
          }
        },
        onDismiss: () => {
          toast.info('Checkout cancelled');
        },
        onError: (_err) => {
          toast.error("Your payment could not be completed. Please try again or select another payment method.");
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

  const filteredPlans = plans.filter((p: any) => {
    if (billingFilter === 'ALL') return true;
    const cycle = p.interval === 'year' ? 'YEARLY' : 'MONTHLY';
    return cycle === billingFilter;
  });

  // Format limit helper
  const formatLimit = (value: number | undefined, unit: string) => {
    if (value === -1) return `Unlimited ${unit}`;
    if (value === 0 || value === undefined) return `0 ${unit}`;
    return `Up to ${value} ${unit}`;
  };

  return (
    <div id="pricing-plans-section" className={`space-y-16 ${className}`}>
      {/* Header Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge
          variant="outline"
          className="px-4 py-1.5 text-xs border-violet-500/30 text-violet-300 bg-violet-500/10"
        >
          <Zap className="w-3.5 h-3.5 mr-1.5 inline text-amber-400" />
          Subscription Plans & Entitlements
        </Badge>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          Choose Your <span className="gradient-text">NexaSocial Plan</span>
        </h1>

        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          Manage your social media, livestreams and content from one place.
          Choose a plan below to unlock subscription-protected broadcasting, scheduling, and AI tools.
        </p>

        {/* Billing Filter Tabs */}
        <div className="flex items-center justify-center gap-2 pt-4">
          <div className="p-1 rounded-xl bg-white/5 border border-white/10 inline-flex">
            <button
              onClick={() => setBillingFilter('ALL')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                billingFilter === 'ALL'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              All Plans
            </button>
            <button
              onClick={() => setBillingFilter('MONTHLY')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                billingFilter === 'MONTHLY'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingFilter('YEARLY')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                billingFilter === 'YEARLY'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              Yearly Billing
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                Best Value
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-8 rounded-3xl glass-card border border-white/10 animate-pulse space-y-6 h-[520px]"
            >
              <div className="h-6 w-32 bg-white/10 rounded" />
              <div className="h-10 w-44 bg-white/10 rounded" />
              <div className="space-y-3 pt-6">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="h-4 bg-white/5 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12 p-8 rounded-3xl bg-rose-500/10 border border-rose-500/20 max-w-xl mx-auto space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-lg font-bold text-rose-300">Could not load subscription plans</h3>
          <p className="text-xs text-muted-foreground">
            {error instanceof Error ? error.message : 'Failed to connect to plans server.'}
          </p>
          <Button
            onClick={() => refetchPlans()}
            variant="outline"
            className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Retry Loading Plans
          </Button>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-3xl bg-white/5 border border-white/10 max-w-xl mx-auto space-y-3">
          <HelpCircle className="w-10 h-10 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-bold text-white">No active plans available right now</h3>
          <p className="text-xs text-muted-foreground">
            There are currently no active public subscription plans in this billing category.
            Please check back shortly or contact our administrator.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
          {filteredPlans.map((plan: any) => {
            const isCurrent = currentPlanName === plan.name && hasActiveSubscription;
            const isRecommended = !!plan.isPopular;
            const isCurrentProcessing = isProcessing && selectedPlanId === plan.id;
            const price = Number(plan.price) || 0;
            const currencySymbol = plan.currency === 'USD' ? '$' : '₹';

            return (
              <div
                key={plan.id}
                className={`p-8 rounded-3xl glass-card relative flex flex-col justify-between space-y-6 border transition-all duration-300 ${
                  isRecommended
                    ? 'border-violet-500 shadow-2xl shadow-violet-500/25 lg:scale-[1.03] bg-card/95 z-20'
                    : isCurrent
                      ? 'border-emerald-500/60 bg-emerald-950/15'
                      : 'border-white/10 hover:border-violet-500/40 z-10'
                }`}
              >
                {/* Recommended Badge only when explicitly set by Admin in DB */}
                {isRecommended && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white text-[10px] uppercase font-mono font-black tracking-widest px-4 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>RECOMMENDED</span>
                  </div>
                )}

                {isCurrent && !isRecommended && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] uppercase font-mono font-black tracking-widest px-4 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                    <span>CURRENT PLAN</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black tracking-tight text-white">{plan.name}</h3>
                      {plan.code && (
                        <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
                          {plan.code}
                        </span>
                      )}
                    </div>
                    {isRecommended && (
                      <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-[10px]">
                        Popular Tier
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {plan.description || `Full NexaSocial social media & live broadcasting capabilities.`}
                  </p>

                  {/* Pricing Display */}
                  <div className="flex items-baseline gap-1 pt-2">
                    <span className="text-4xl sm:text-5xl font-black font-mono gradient-text">
                      {`${currencySymbol}${price.toLocaleString()}`}
                    </span>
                    {price > 0 && (
                      <span className="text-xs text-muted-foreground font-mono">
                        /{plan.interval === 'year' ? 'year' : 'mo'}
                      </span>
                    )}
                    {plan.durationDays && plan.durationDays > 0 && (
                      <span className="text-[10px] text-muted-foreground font-mono ml-1">
                        ({plan.durationDays} days)
                      </span>
                    )}
                  </div>

                  {/* Feature Lists & Limits */}
                  <div className="space-y-3 pt-6 border-t border-white/10 text-xs">
                    <div className="flex items-start gap-2.5 font-medium text-foreground/90">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{formatLimit(plan.features?.socialAccounts, 'Connected Accounts')}</span>
                    </div>

                    <div className="flex items-start gap-2.5 font-medium text-foreground/90">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        {formatLimit(plan.features?.workspaces, 'Workspaces')} (
                        {formatLimit(plan.features?.teamMembers, 'Seats')})
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5 font-medium text-foreground/90">
                      {plan.features?.liveStreaming ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <span className={plan.features?.liveStreaming ? '' : 'text-muted-foreground'}>
                        {plan.features?.liveStreaming
                          ? plan.features?.maxStreams === -1
                            ? 'Unlimited Live Broadcasts'
                            : `Live Streaming (${formatLimit(plan.features?.maxStreams ?? 100, 'Streams')})`
                          : 'Live Streaming Not Included'}
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5 font-medium text-foreground/90">
                      {plan.features?.streamScheduling ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <span className={plan.features?.streamScheduling ? '' : 'text-muted-foreground'}>
                        {plan.features?.streamScheduling
                          ? 'Post & Stream Scheduling Included'
                          : 'Scheduling Not Included'}
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5 font-medium text-foreground/90">
                      {plan.features?.aiFeatures ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <span className={plan.features?.aiFeatures ? '' : 'text-muted-foreground'}>
                        {plan.features?.aiFeatures
                          ? 'AI Copilot & Caption Generator'
                          : 'AI Tools Not Included'}
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5 font-medium text-foreground/90">
                      {plan.features?.analytics ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <span className={plan.features?.analytics ? '' : 'text-muted-foreground'}>
                        {plan.features?.analytics
                          ? 'Audience Analytics & Engagement Reports'
                          : 'Basic Analytics Only'}
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5 font-medium text-foreground/90">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{formatLimit(plan.features?.storageGb, 'GB Cloud Media Storage')}</span>
                    </div>
                  </div>
                </div>

                {/* Purchase Action Button */}
                <div className="space-y-3 pt-4">
                  <Button
                    className={`w-full h-12 text-xs font-extrabold rounded-xl transition-all ${
                      isCurrent
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/40 cursor-default'
                        : isRecommended
                          ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 shadow-xl shadow-violet-500/30 hover:scale-[1.02] text-white'
                          : 'bg-white/10 text-foreground hover:bg-violet-500/20'
                    }`}
                    onClick={() => handleCheckout(plan)}
                    disabled={isProcessing || isCurrent}
                  >
                    {isCurrentProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting Razorpay...
                      </>
                    ) : isCurrent ? (
                      'Current Active Plan'
                    ) : price === 0 && (plan.name === 'Enterprise' || plan.name === 'Enterprise Plan' || plan.name?.toLowerCase().includes('enterprise')) ? (
                      <Link href="mailto:sales@nexasocial.com" className="flex items-center justify-center gap-2">
                        Contact Enterprise Sales
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <>
                        <span>Choose {plan.name}</span>
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </>
                    )}
                  </Button>

                  <p className="text-[11px] text-center text-muted-foreground font-mono">
                    Razorpay Secured • Cancel Anytime
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Phase 5 — Feature Comparison Section */}
      {showComparison && plans.length > 0 && (
        <div className="space-y-8 max-w-7xl mx-auto pt-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Feature Comparison Matrix
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Compare exact feature entitlements and limits configured across each NexaSocial subscription tier.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="py-4 px-6 font-bold text-white uppercase text-[11px] tracking-wider w-1/3">
                      Platform Capability
                    </th>
                    {plans.map((p: any) => (
                      <th
                        key={p.id}
                        className={`py-4 px-6 font-bold text-center text-[11px] uppercase tracking-wider ${
                          p.isPopular ? 'text-violet-300 bg-violet-500/10' : 'text-white'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span>{p.name}</span>
                          <span className="text-[10px] font-mono text-muted-foreground font-normal lowercase">
                            ₹{Number(p.price)}/{p.interval}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {/* Connected Accounts */}
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-medium text-white/90">
                      Connected Social Accounts
                    </td>
                    {plans.map((p: any) => (
                      <td key={p.id} className="py-4 px-6 text-center text-muted-foreground font-medium">
                        {p.features?.socialAccounts === -1
                          ? 'Unlimited'
                          : `Up to ${p.features?.socialAccounts || 1}`}
                      </td>
                    ))}
                  </tr>

                  {/* Workspaces */}
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-medium text-white/90">Workspaces</td>
                    {plans.map((p: any) => (
                      <td key={p.id} className="py-4 px-6 text-center text-muted-foreground font-medium">
                        {p.features?.workspaces === -1
                          ? 'Unlimited'
                          : `Up to ${p.features?.workspaces || 1}`}
                      </td>
                    ))}
                  </tr>

                  {/* Team Members */}
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-medium text-white/90">Team Members per Workspace</td>
                    {plans.map((p: any) => (
                      <td key={p.id} className="py-4 px-6 text-center text-muted-foreground font-medium">
                        {p.features?.teamMembers === -1
                          ? 'Unlimited'
                          : `Up to ${p.features?.teamMembers || 1}`}
                      </td>
                    ))}
                  </tr>

                  {/* Live Streaming */}
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-medium text-white/90">Live Streaming Broadcasts</td>
                    {plans.map((p: any) => (
                      <td key={p.id} className="py-4 px-6 text-center font-medium">
                        {p.features?.liveStreaming ? (
                          <span className="text-emerald-400 flex items-center justify-center gap-1">
                            <Check className="w-4 h-4" /> Included
                          </span>
                        ) : (
                          <span className="text-muted-foreground flex items-center justify-center gap-1">
                            <X className="w-4 h-4" /> Not included
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Concurrent / Total Streams */}
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-medium text-white/90">Stream Capacity / Concurrency</td>
                    {plans.map((p: any) => (
                      <td key={p.id} className="py-4 px-6 text-center text-muted-foreground font-medium">
                        {!p.features?.liveStreaming
                          ? 'Not included'
                          : p.features?.maxStreams === -1
                            ? 'Unlimited'
                            : `Up to ${p.features?.maxStreams || 100} streams`}
                      </td>
                    ))}
                  </tr>

                  {/* Multi-Platform Streaming */}
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-medium text-white/90">Simultaneous Multi-Destination Streaming</td>
                    {plans.map((p: any) => (
                      <td key={p.id} className="py-4 px-6 text-center font-medium">
                        {p.features?.multiPlatformStreaming ? (
                          <span className="text-emerald-400 flex items-center justify-center gap-1">
                            <Check className="w-4 h-4" /> Included
                          </span>
                        ) : (
                          <span className="text-muted-foreground flex items-center justify-center gap-1">
                            <X className="w-4 h-4" /> Not included
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Content Scheduling */}
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-medium text-white/90">Post & Stream Scheduling</td>
                    {plans.map((p: any) => (
                      <td key={p.id} className="py-4 px-6 text-center font-medium">
                        {p.features?.streamScheduling ? (
                          <span className="text-emerald-400 flex items-center justify-center gap-1">
                            <Check className="w-4 h-4" /> Included
                          </span>
                        ) : (
                          <span className="text-muted-foreground flex items-center justify-center gap-1">
                            <X className="w-4 h-4" /> Not included
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* AI Tools & Usage Limits */}
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-medium text-white/90">AI Tools & Copilot</td>
                    {plans.map((p: any) => (
                      <td key={p.id} className="py-4 px-6 text-center font-medium">
                        {p.features?.aiFeatures ? (
                          <span className="text-emerald-400 flex items-center justify-center gap-1">
                            <Check className="w-4 h-4" />{' '}
                            {p.features?.aiLimit === -1 ? 'Unlimited' : 'Included'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground flex items-center justify-center gap-1">
                            <X className="w-4 h-4" /> Not included
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Analytics */}
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-medium text-white/90">Real-Time Analytics & Growth Reports</td>
                    {plans.map((p: any) => (
                      <td key={p.id} className="py-4 px-6 text-center font-medium">
                        {p.features?.analytics ? (
                          <span className="text-emerald-400 flex items-center justify-center gap-1">
                            <Check className="w-4 h-4" /> Advanced
                          </span>
                        ) : (
                          <span className="text-muted-foreground flex items-center justify-center gap-1">
                            Basic only
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Cloud Storage */}
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-medium text-white/90">Media Cloud Storage</td>
                    {plans.map((p: any) => (
                      <td key={p.id} className="py-4 px-6 text-center text-muted-foreground font-medium">
                        {p.features?.storageGb === -1
                          ? 'Unlimited'
                          : `${p.features?.storageGb || 1} GB`}
                      </td>
                    ))}
                  </tr>

                  {/* Priority Support */}
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-medium text-white/90">Support SLA</td>
                    {plans.map((p: any) => (
                      <td key={p.id} className="py-4 px-6 text-center text-muted-foreground font-medium">
                        {p.features?.prioritySupport ? '24/7 Priority Support' : 'Standard Email Support'}
                      </td>
                    ))}
                  </tr>

                  {/* API Access */}
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-medium text-white/90">API Access & Developer Keys</td>
                    {plans.map((p: any) => (
                      <td key={p.id} className="py-4 px-6 text-center font-medium">
                        {p.features?.apiAccess ? (
                          <span className="text-emerald-400 flex items-center justify-center gap-1">
                            <Check className="w-4 h-4" /> Included
                          </span>
                        ) : (
                          <span className="text-muted-foreground flex items-center justify-center gap-1">
                            <X className="w-4 h-4" /> Not included
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
