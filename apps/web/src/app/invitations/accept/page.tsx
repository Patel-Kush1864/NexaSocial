'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { workspaceService } from '@/services/workspace.service';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, MailOpen } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/hooks/use-auth';

function InvitationAcceptContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [isSuccess, setIsSuccess] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  const acceptMutation = useMutation({
    mutationFn: () => workspaceService.acceptInvitation(token!),
    onSuccess: (data) => {
      toast.success('Invitation accepted successfully!');
      setIsSuccess(true);
      setWorkspaceId(data.workspaceId);
      // Wait a moment then redirect
      setTimeout(() => {
        router.push('/');
      }, 2000);
    },
    onError: (error: any) => {
      console.error('Accept API Error:', error.response?.data);
      const serverMsg = error.response?.data?.message;
      let msg = 'Failed to accept invitation. It may be expired.';
      if (Array.isArray(serverMsg)) {
        msg = serverMsg.join(', ');
      } else if (typeof serverMsg === 'string') {
        msg = serverMsg;
      }
      toast.error(msg);
    }
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
    }
  });

  if (isAuthLoading) {
    return (
      <Card className="w-full max-w-md glass-panel border-white/10 shadow-2xl p-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    );
  }

  if (!isAuthenticated && token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pending_invitation_token', token);
    }
    return (
      <Card className="w-full max-w-md glass-panel border-white/10 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <MailOpen className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Sign In Required</CardTitle>
          <CardDescription>
            You must be signed in to accept this workspace invitation.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-3 pb-8">
          <Button 
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold"
            size="lg"
            onClick={() => router.push('/login')}
          >
            Sign In to Accept
          </Button>
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={() => router.push('/register')}
          >
            Create an Account
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md glass-panel border-white/10 shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Invalid Link</CardTitle>
          <CardDescription>
            This invitation link is invalid or missing a token.
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

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md glass-panel border-primary/20 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <MailOpen className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome!</CardTitle>
          <CardDescription>
            You have successfully joined the workspace. Redirecting you to your dashboard...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md glass-panel border-white/10 shadow-2xl">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <MailOpen className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-bold">Workspace Invitation</CardTitle>
        <CardDescription>
          You have been invited to join a NexaSocial workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center pb-6 text-sm text-muted-foreground">
        Click below to accept the invitation and join your team.
      </CardContent>
      <CardFooter className="flex flex-col gap-3 pb-8">
        <Button 
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold"
          size="lg"
          onClick={() => acceptMutation.mutate()}
          disabled={acceptMutation.isPending || rejectMutation.isPending}
        >
          {acceptMutation.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Accepting...</>
          ) : (
            'Accept Invitation'
          )}
        </Button>
        <Button 
          variant="ghost" 
          className="w-full"
          onClick={() => rejectMutation.mutate()}
          disabled={acceptMutation.isPending || rejectMutation.isPending}
        >
          {rejectMutation.isPending ? 'Declining...' : 'Decline'}
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
