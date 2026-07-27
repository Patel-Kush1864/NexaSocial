'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(() =>
    token ? 'verifying' : 'error',
  );
  const [message, setMessage] = useState(() =>
    token ? '' : 'Missing email verification token.',
  );

  useEffect(() => {
    if (!token) return;

    authService
      .verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message || 'Your email has been verified successfully!');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification link expired or invalid.');
      });
  }, [token]);

  if (status === 'verifying') {
    return (
      <div className="text-center py-8 space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
        <p className="text-sm font-medium text-muted-foreground">
          Verifying your email address...
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center py-6 space-y-6">
        <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
        <div className="space-y-2">
          <h3 className="text-lg font-bold">Email Verified!</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <Button
          asChild
          className="w-full h-11 bg-linear-to-r from-violet-600 to-indigo-600 font-semibold"
        >
          <Link href="/login">
            Continue to Sign In
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center py-6 space-y-6">
      <XCircle className="w-14 h-14 text-destructive mx-auto" />
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-destructive">Verification Failed</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <Button asChild variant="outline" className="w-full h-11">
        <Link href="/login">Back to Sign In</Link>
      </Button>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Card className="glass-panel border-border/60 shadow-2xl">
      <CardHeader className="space-y-2 text-center sm:text-left">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Email Verification
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          Confirming your email address for NexaSocial
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin mx-auto" />}>
          <VerifyEmailContent />
        </Suspense>
      </CardContent>
    </Card>
  );
}
