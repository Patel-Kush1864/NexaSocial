'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/hooks/use-workspace';
import { useSubscriptionEntitlements } from '@/hooks/use-entitlements';
import { createWorkspaceSchema, type CreateWorkspaceFormValues } from '@/lib/validators';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Building2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import type { Workspace } from '@/types';

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (workspace: Workspace) => void;
}

export function CreateWorkspaceDialog({ open, onOpenChange, onSuccess }: CreateWorkspaceDialogProps) {
  const router = useRouter();
  const { workspaces, createWorkspace, isCreating } = useWorkspace();
  const { entitlements, hasActiveSubscription } = useSubscriptionEntitlements();

  const maxWorkspaces = entitlements?.features?.workspaces;
  const isUnlimited = maxWorkspaces === -1;
  const isLimitReached =
    hasActiveSubscription &&
    !isUnlimited &&
    typeof maxWorkspaces === 'number' &&
    workspaces.length >= maxWorkspaces;

  const form = useForm<CreateWorkspaceFormValues>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue('name', name);
    // Auto-generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    form.setValue('slug', slug);
  };

  const onSubmit = async (data: CreateWorkspaceFormValues) => {
    if (!hasActiveSubscription) {
      onOpenChange(false);
      router.push('/billing');
      return;
    }
    if (isLimitReached) {
      onOpenChange(false);
      router.push('/billing');
      return;
    }

    try {
      const newWs = await createWorkspace(data);
      form.reset();
      onOpenChange(false);
      onSuccess?.(newWs);
    } catch {
      // Handled by toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-panel">
        <DialogHeader className="space-y-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Building2 className="w-5 h-5" />
          </div>
          <DialogTitle className="text-xl font-bold">Create Workspace</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Workspaces organize your team, social accounts, and live streams.
          </DialogDescription>
        </DialogHeader>

        {/* Subscription Plan Limit Banner */}
        {!hasActiveSubscription ? (
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                An active subscription plan is required to create a workspace.
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                router.push('/billing');
              }}
              className="self-start text-xs bg-amber-500 text-black hover:bg-amber-400 font-semibold"
            >
              Choose Subscription Plan
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        ) : isLimitReached ? (
          <div className="p-3.5 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive-foreground text-xs flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              <span>
                You have reached your workspace limit ({workspaces.length} of {maxWorkspaces}) for the{' '}
                <strong>{entitlements?.planName || 'current'}</strong> plan.
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                router.push('/billing');
              }}
              className="self-start text-xs bg-primary text-primary-foreground font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Upgrade Plan to Add Workspaces
            </Button>
          </div>
        ) : (
          <div className="px-3 py-2 rounded-lg bg-muted/40 border border-border/50 text-xs text-muted-foreground flex items-center justify-between">
            <span>
              Plan limit ({entitlements?.planName || 'Active Plan'}):
            </span>
            <span className="font-semibold text-foreground">
              {workspaces.length} / {isUnlimited ? 'Unlimited' : `${maxWorkspaces} workspaces`}
            </span>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="ws-name">Workspace Name</Label>
            <Input
              id="ws-name"
              placeholder="Acme Corp"
              disabled={!hasActiveSubscription || isLimitReached}
              {...form.register('name')}
              onChange={handleNameChange}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ws-slug">Workspace Slug</Label>
            <Input
              id="ws-slug"
              placeholder="acme-corp"
              disabled={!hasActiveSubscription || isLimitReached}
              {...form.register('slug')}
            />
            {form.formState.errors.slug && (
              <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ws-desc">Description (Optional)</Label>
            <Input
              id="ws-desc"
              placeholder="Primary social media workspace"
              disabled={!hasActiveSubscription || isLimitReached}
              {...form.register('description')}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !hasActiveSubscription || isLimitReached}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : isLimitReached ? (
                'Limit Reached'
              ) : !hasActiveSubscription ? (
                'Subscription Required'
              ) : (
                'Create Workspace'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
