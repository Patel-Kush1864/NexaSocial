'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { inviteMemberSchema, type InviteMemberFormValues } from '@/lib/validators';
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
import { UserPlus, Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import { useWorkspaceMembers } from '@/hooks/use-workspace';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useSubscriptionEntitlements } from '@/hooks/use-entitlements';

interface InviteMemberDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberDialog({ workspaceId, open, onOpenChange }: InviteMemberDialogProps) {
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceStore();
  const { entitlements } = useSubscriptionEntitlements();
  const isManagerOnly = currentWorkspace?.role === 'MANAGER';

  const form = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: '',
      role: 'CREATOR',
    },
  });

  const { members, inviteMember, isInviting } = useWorkspaceMembers(workspaceId);

  const maxMembers = entitlements?.features?.teamMembers;
  const isUnlimited = maxMembers === -1;
  const isLimitReached =
    !isUnlimited &&
    typeof maxMembers === 'number' &&
    (members?.length ?? 0) >= maxMembers;

  const onSubmit = async (data: InviteMemberFormValues) => {
    if (isLimitReached) {
      onOpenChange(false);
      router.push('/billing');
      return;
    }

    try {
      await inviteMember({ workspaceId, email: data.email, role: data.role });
      form.reset();
      onOpenChange(false);
    } catch {
      // Error handling is managed by the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-panel">
        <DialogHeader className="space-y-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <UserPlus className="w-5 h-5" />
          </div>
          <DialogTitle className="text-xl font-bold">Invite Team Member</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Invited members will receive an email to join workspace #{workspaceId.slice(0, 8)}.
          </DialogDescription>
        </DialogHeader>

        {isLimitReached ? (
          <div className="p-3.5 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive-foreground text-xs flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              <span>
                You have reached your team member limit ({members?.length ?? 0} of {maxMembers}) for the{' '}
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
              Upgrade Plan to Invite Members
            </Button>
          </div>
        ) : (
          <div className="px-3 py-2 rounded-lg bg-muted/40 border border-border/50 text-xs text-muted-foreground flex items-center justify-between">
            <span>
              Plan limit ({entitlements?.planName || 'Active'}):
            </span>
            <span className="font-semibold text-foreground">
              {members?.length ?? 0} / {isUnlimited ? 'Unlimited' : `${maxMembers} members`}
            </span>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email Address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="teammate@company.com"
              disabled={isLimitReached}
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              disabled={isLimitReached}
              {...form.register('role')}
              className="w-full h-10 px-3 rounded-md bg-background border border-input text-xs font-medium focus:ring-1 focus:ring-primary"
            >
              {!isManagerOnly && (
                <option value="MANAGER">Manager (Full edit & account management)</option>
              )}
              <option value="CREATOR">Creator (Schedule streams & posts)</option>
              <option value="VIEWER">Viewer (Read-only analytics)</option>
            </select>
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
              disabled={isLimitReached || isInviting || form.formState.isSubmitting}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold"
            >
              {isInviting || form.formState.isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : isLimitReached ? (
                'Member Limit Reached'
              ) : (
                'Send Invitation'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
