'use client';

// ═══════════════════════════════════════════════════════════════════
// NexaSocial — Subscription Onboarding Screen
// Displayed on workspace-protected routes before subscription activation
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useSubscriptionEntitlements } from '@/hooks/use-entitlements';
import { CreateWorkspaceDialog } from '@/components/dialogs/create-workspace-dialog';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  LogOut,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Layers,
  Radio,
  Share2,
  Building2,
  Plus,
} from 'lucide-react';

export function SubscriptionOnboardingScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { hasActiveSubscription, planName } = useSubscriptionEntitlements();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleChoosePlan = () => {
    router.push('/billing');
  };

  const handleCreateWorkspace = () => {
    router.push('/workspaces/create');
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="py-8 sm:py-12 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Hero Glassmorphic Onboarding Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950/80 via-slate-900/90 to-indigo-950/80 border border-violet-500/30 p-8 sm:p-12 shadow-2xl">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>
              {hasActiveSubscription
                ? `${planName || 'Active'} Subscription Active • Ready to Create Workspace`
                : 'Workspace Setup Required'}
            </span>
          </div>

          <div className="space-y-3">
            <h1
              id="onboarding-screen-title"
              className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight"
            >
              {hasActiveSubscription
                ? 'Create Your Workspace'
                : 'Set Up Your NexaSocial Workspace'}
            </h1>
            <p
              id="onboarding-screen-message"
              className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl"
            >
              {hasActiveSubscription
                ? 'Your subscription is active. Create your workspace to get started with NexaSocial.'
                : 'To create your workspace, first choose a subscription plan and complete the purchase. Once your subscription is activated, you can create your workspace here.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            {hasActiveSubscription ? (
              <Button
                id="btn-create-workspace"
                onClick={handleCreateWorkspace}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold px-6 py-2.5 h-auto rounded-xl shadow-lg shadow-violet-600/25 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                id="btn-choose-plan"
                onClick={handleChoosePlan}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold px-6 py-2.5 h-auto rounded-xl shadow-lg shadow-violet-600/25 flex items-center gap-2 transition-all cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Choose Subscription Plan</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}

            <Button
              id="btn-logout"
              onClick={handleLogout}
              variant="outline"
              className="border-border/60 hover:bg-muted/50 text-muted-foreground hover:text-white px-5 py-2.5 h-auto rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </Button>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-4 border-t border-border/30 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 text-violet-300/90 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Idempotent Provisioning
            </span>
            <span className="flex items-center gap-1.5 text-violet-300/90 font-medium">
              <Zap className="w-4 h-4 text-amber-400" />
              Instant Workspace Activation
            </span>
            <span className="flex items-center gap-1.5 text-violet-300/90 font-medium">
              <Layers className="w-4 h-4 text-indigo-400" />
              Multi-Platform Social Relay
            </span>
          </div>
        </div>
      </div>

      {/* Feature Preview Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/90 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          Included in your NexaSocial Workspace Plan
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-border/40 bg-card/40 relative space-y-2.5 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Radio className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white">Multi-Destination Streams</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Broadcast ultra-low latency live streams simultaneously to YouTube, Facebook, and Instagram.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/40 bg-card/40 relative space-y-2.5 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Share2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white">Social Channel Hub</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect and synchronize multiple creator profiles with unified publishing and analytics.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/40 bg-card/40 relative space-y-2.5 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white">AI Content Assistant</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Generate viral captions, optimize engagement tags, and schedule posts across all channels.
            </p>
          </div>
        </div>
      </div>

      {/* Workspace Creation Modal */}
      <CreateWorkspaceDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => {
          setIsCreateOpen(false);
          router.push('/dashboard');
        }}
      />
    </div>
  );
}
