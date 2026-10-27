'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { workspaceService } from '@/services/workspace.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, MailOpen, AlertCircle, CheckCircle2, Shield, Building2, UserCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import type { InvitationValidationResponse } from '@/types';

function InvitationAcceptContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = searchParams.get('token');
  const { isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const { user } = useAuthStore();
  const { setWorkspaces, switchWorkspace } = useWorkspaceStore();

  const [isSuccess, setIsSuccess] = useState(false);

  // Validate invitation token
  const {
    data: invitation,
    isLoading: isValidationLoading,
    error: validationError,
  } = useQuery<InvitationValidationResponse>({
    queryKey: ['invitation', 'validate', token],
    queryFn: () => workspaceService.validateInvitation(token!),
    enabled: !!token,
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: () => workspaceService.acceptInvitation(token!),
    onSuccess: async (data) => {
      toast.success('Your invitation has been accepted. Welcome to the workspace!');
      setIsSuccess(true);

      try {
        // Fetch fresh workspace list and switch directly to the newly joined workspace
        const freshWorkspaces = await workspaceService.getAll();
        setWorkspaces(freshWorkspaces);
        if (data.workspaceId) {
          switchWorkspace(data.workspaceId);
        }
        await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        await queryClient.invalidateQueries({ queryKey: ['subscriptions', 'entitlements'] });
        await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      } catch (err) {
        console.error('Error refreshing workspaces after acceptance:', err);
      }

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    },
    onError: (error: any) => {
      console.error('Accept API Error:', error.response?.data);
      const serverMsg = error.response?.data?.message;
      let msg = 'Failed to accept invitation. It may be expired or already used.';
      if (Array.isArray(serverMsg)) {
        msg = serverMsg.join(', ');
      } else if (typeof serverMsg === 'string') {
        msg = serverMsg;
      }
      toast.error(msg);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => workspaceService.rejectInvitation(token!),
    onSuccess: () => {
      toast.success('Invitation declined.');
      router.push('/');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to reject invitation.';
      toast.error(msg);
    },
  });

  if (isAuthLoading || (token && isValidationLoading)) {
    return (
      <Card className="w-full max-w-md glass-panel border-white/10 shadow-2xl p-12 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Validating workspace invitation...</p>
      </Card>
    );
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md glass-panel border-white/10 shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Invalid Link</CardTitle>
          <CardDescription>
            This invitation link is missing a valid token.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center pb-8">
          <Button asChild variant="outline">
            <Link href="/">Return Home</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (validationError) {
    const errorData = (validationError as any)?.response?.data;
    const errorMsg =
      errorData?.message || 'This invitation token is invalid, expired, or has already been accepted.';

    return (
      <Card className="w-full max-w-md glass-panel border-rose-500/30 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Invitation Unavailable</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {errorMsg}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-3 pb-8">
          <Button asChild className="w-full" variant="outline">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild className="w-full" variant="ghost">
            <Link href="/">Return Home</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!isAuthenticated) {
    if (typeof window !== 'undefined' && token) {
      localStorage.setItem('pending_invitation_token', token);
    }
    return (
      <Card className="w-full max-w-md glass-panel border-white/10 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <MailOpen className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Sign In Required</CardTitle>
          <CardDescription className="space-y-1">
            <span className="block">
              You have been invited to join <strong className="text-foreground">{invitation?.workspaceName || 'a workspace'}</strong> as a <Badge variant="secondary" className="font-semibold">{invitation?.role || 'MEMBER'}</Badge>.
            </span>
            <span className="block text-primary font-medium">
              Please log in to accept your workspace invitation.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-xs text-muted-foreground pb-4">
          Invitation sent to: <span className="text-foreground font-medium">{invitation?.email}</span>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pb-8">
          <Button 
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold"
            size="lg"
            onClick={() => router.push(`/login?token=${token}`)}
          >
            Sign In to Accept
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => router.push(`/register?token=${token}`)}
          >
            Create an Account
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Check for email mismatch
  const isEmailMismatch =
    user?.email &&
    invitation?.email &&
    user.email.toLowerCase() !== invitation.email.toLowerCase();

  if (isEmailMismatch) {
    return (
      <Card className="w-full max-w-md glass-panel border-amber-500/40 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Email Address Mismatch</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            This invitation was sent to <strong className="text-amber-200">{invitation?.email}</strong>, but you are currently signed in as <strong className="text-white">{user?.email}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-xs text-muted-foreground pb-4">
          Please use the email address to which this invitation was sent.
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pb-8">
          <Button 
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            size="lg"
            onClick={async () => {
              if (token) {
                localStorage.setItem('pending_invitation_token', token);
              }
              await logout();
              router.push(`/login?token=${token}`);
            }}
          >
            Switch Account & Sign In
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/dashboard">Continue to My Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md glass-panel border-emerald-500/30 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to {invitation?.workspaceName || 'the Team'}!</CardTitle>
          <CardDescription>
            You have successfully joined the workspace. Redirecting you to your team dashboard...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md glass-panel border-white/10 shadow-2xl">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <Building2 className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-bold">Team Invitation</CardTitle>
        <CardDescription>
          {invitation?.inviterName ? (
            <><strong>{invitation.inviterName}</strong> invited you to join </>
          ) : (
            <>You have been invited to join </>
          )}
          <span className="text-foreground font-semibold">{invitation?.workspaceName || 'Workspace'}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pb-6">
        <div className="p-4 rounded-xl bg-accent/30 border border-border/40 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Workspace</span>
            <span className="font-semibold text-foreground">{invitation?.workspaceName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Assigned Role</span>
            <Badge variant="outline" className="font-mono text-primary border-primary/30">
              {invitation?.role}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Invited As</span>
            <span className="font-mono text-muted-foreground">{invitation?.email}</span>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Accepting gives you role-based access governed by the workspace plan.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 pb-8">
        <Button 
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold shadow-md shadow-violet-500/20"
          size="lg"
          onClick={() => acceptMutation.mutate()}
          disabled={acceptMutation.isPending || rejectMutation.isPending}
        >
          {acceptMutation.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Joining Workspace...</>
          ) : (
            'Accept & Join Workspace'
          )}
        </Button>
        <Button 
          variant="ghost" 
          className="w-full text-xs text-muted-foreground"
          onClick={() => rejectMutation.mutate()}
          disabled={acceptMutation.isPending || rejectMutation.isPending}
        >
          {rejectMutation.isPending ? 'Declining...' : 'Decline Invitation'}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function InvitationAcceptPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 p-4">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Suspense fallback={
          <div className="w-full h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }>
          <InvitationAcceptContent />
        </Suspense>
      </div>
    </div>
  );
}
