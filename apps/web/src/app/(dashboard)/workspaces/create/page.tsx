'use client';

// ═══════════════════════════════════════════════════════════════════
// NexaSocial — Dedicated Create Workspace Page
// Only accessible after successful subscription activation
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useWorkspace } from '@/hooks/use-workspace';
import { useSubscriptionEntitlements } from '@/hooks/use-entitlements';
import { createWorkspaceSchema, type CreateWorkspaceFormValues } from '@/lib/validators';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import {
  Building2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Zap,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CreateWorkspacePage() {
  const router = useRouter();
  const { createWorkspace, isCreating } = useWorkspace();
  const {
    hasActiveSubscription,
    planName,
    isLoading: isEntitlementsLoading,
  } = useSubscriptionEntitlements();

  const form = useForm<CreateWorkspaceFormValues>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  });

  // Guard: If user has no active subscription, redirect to billing
  useEffect(() => {
    if (!isEntitlementsLoading && !hasActiveSubscription) {
      toast.info('Subscription Required', {
        description: 'Please select and activate a subscription plan before creating your workspace.',
      });
      router.push('/billing');
    }
  }, [hasActiveSubscription, isEntitlementsLoading, router]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue('name', name, { shouldValidate: true });
    // Auto-generate clean slug
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    form.setValue('slug', slug, { shouldValidate: true });
  };

  const onSubmit = async (data: CreateWorkspaceFormValues) => {
    try {
      const workspace = await createWorkspace({
        name: data.name.trim(),
        slug: data.slug.trim(),
        description: data.description?.trim() || undefined,
      });

      toast.success('Workspace Created!', {
        description: `Welcome to ${workspace.name}! Your workspace is active and ready.`,
      });

      router.push('/dashboard');
    } catch {
      // Error handled by useWorkspace mutation toast
    }
  };

  if (isEntitlementsLoading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Validating subscription status..." />
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return null;
  }

  return (
    <div className="py-6 sm:py-10 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      <Card className="glass-panel border-violet-500/30 shadow-2xl relative overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-violet-950/40 via-background to-indigo-950/30 rounded-3xl">
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <CardHeader className="space-y-4 relative z-10 pb-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-md w-fit">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{planName || 'Active'} Subscription Activated</span>
          </div>

          <div className="space-y-1.5">
            <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Building2 className="w-8 h-8 text-violet-400" />
              Create Your Workspace
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground leading-relaxed">
              Your subscription is active. Choose a unique name for your organization or brand workspace to get started.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 space-y-6 pt-2">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Workspace Name */}
            <div className="space-y-2">
              <Label htmlFor="create-workspace-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Workspace Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-workspace-name"
                placeholder="e.g. Acme Media Hub"
                className="h-11 bg-background/50 border-border/60 focus-visible:ring-violet-500 focus-visible:border-violet-500 rounded-xl font-medium"
                {...form.register('name')}
                onChange={handleNameChange}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive font-medium">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Workspace Slug */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="create-workspace-slug" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Workspace Slug <span className="text-destructive">*</span>
                </Label>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Used in unique URLs and API endpoints
                </span>
              </div>
              <Input
                id="create-workspace-slug"
                placeholder="e.g. acme-media-hub"
                className="h-11 bg-background/50 border-border/60 focus-visible:ring-violet-500 focus-visible:border-violet-500 rounded-xl font-mono text-xs"
                {...form.register('slug')}
              />
              {form.formState.errors.slug && (
                <p className="text-xs text-destructive font-medium">
                  {form.formState.errors.slug.message}
                </p>
              )}
            </div>

            {/* Description (Optional) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="create-workspace-desc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Description
                </Label>
                <span className="text-[11px] text-muted-foreground">(Optional)</span>
              </div>
              <Input
                id="create-workspace-desc"
                placeholder="e.g. Primary social media broadcasting workspace"
                className="h-11 bg-background/50 border-border/60 focus-visible:ring-violet-500 focus-visible:border-violet-500 rounded-xl"
                {...form.register('description')}
              />
            </div>

            {/* Submit Action Button */}
            <div className="pt-2">
              <Button
                id="btn-submit-create-workspace"
                type="submit"
                disabled={isCreating}
                className="w-full h-12 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-500 text-white font-bold shadow-xl shadow-violet-500/25 transition-all rounded-xl cursor-pointer"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up your workspace...
                  </>
                ) : (
                  <>
                    Create Workspace & Open Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Setup Highlights */}
          <div className="pt-4 border-t border-border/40 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full Owner Privileges</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Instant Entitlement Activation</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400 shrink-0" />
              <span>Broadcast Multi-Relay</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
