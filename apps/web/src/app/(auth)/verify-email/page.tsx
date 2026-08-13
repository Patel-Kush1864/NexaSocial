'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

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
        <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto" />
        <p className="text-sm font-medium text-muted-foreground">
          Verifying your email address with NexaSocial engine...
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center py-6 space-y-6">
        <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
        <div className="space-y-2">
          <h3 className="text-xl font-extrabold text-foreground">Email Verified!</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">{message}</p>
        </div>
        <Button
          asChild
          className="w-full h-12 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-500 text-white font-bold shadow-xl shadow-violet-500/25 hover:scale-[1.02] rounded-xl"
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
      <XCircle className="w-16 h-16 text-destructive mx-auto" />
      <div className="space-y-2">
        <h3 className="text-xl font-extrabold text-destructive">Verification Failed</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">{message}</p>
      </div>
      <Button asChild variant="outline" className="w-full h-11 border-white/10 bg-white/5 rounded-xl">
        <Link href="/login">Back to Sign In</Link>
      </Button>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Card className="glass-panel border-border/60 shadow-2xl relative overflow-hidden backdrop-blur-2xl bg-background/80 rounded-2xl">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="space-y-3 text-center sm:text-left pb-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20 w-fit mx-auto sm:mx-0 backdrop-blur-md"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Account Security
        </motion.div>

        <CardTitle className="text-2xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
          Email Verification
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm leading-relaxed">
          Confirming your email identity for NexaSocial.
        </CardDescription>
      </CardHeader>

      <CardContent className="relative z-10">
        <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin mx-auto text-violet-400" />}>
          <VerifyEmailContent />
        </Suspense>
      </CardContent>
    </Card>
  );
}
