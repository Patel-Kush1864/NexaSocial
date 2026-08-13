'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, KeyRound, Lock, ShieldCheck, Eye, EyeOff, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { resetPassword, isResetPending } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(resetPasswordSchema as any),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) return;
    try {
      await resetPassword({ token, password: data.password });
    } catch {
      // Handled by toast
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4 py-4">
        <p className="text-sm text-destructive font-medium">
          Invalid or missing password reset token.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center text-xs font-bold text-violet-400 hover:text-violet-300 hover:underline transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* New Password */}
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs font-semibold">
          New Password
        </Label>
        <div className="relative">
          <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min 8 chars, 1 upper, 1 num"
            autoComplete="new-password"
            {...form.register('password')}
            className="pl-10 pr-10 h-11 bg-background/50 border-border/60 focus-visible:ring-violet-500 focus-visible:border-violet-500 rounded-xl"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Toggle password visibility"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {form.formState.errors.password && (
          <p className="text-xs text-destructive font-medium">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className="text-xs font-semibold">
          Confirm New Password
        </Label>
        <div className="relative">
          <ShieldCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Re-enter new password"
            autoComplete="new-password"
            {...form.register('confirmPassword')}
            className="pl-10 pr-10 h-11 bg-background/50 border-border/60 focus-visible:ring-violet-500 focus-visible:border-violet-500 rounded-xl"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Toggle confirm password visibility"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {form.formState.errors.confirmPassword && (
          <p className="text-xs text-destructive font-medium">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isResetPending}
        className="w-full h-12 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-500 text-white font-bold shadow-xl shadow-violet-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl cursor-pointer"
      >
        {isResetPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Resetting password...
          </>
        ) : (
          <>
            Reset Password
            <KeyRound className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>

      <div className="text-center pt-2">
        <Link
          href="/login"
          className="inline-flex items-center text-xs font-bold text-violet-400 hover:text-violet-300 hover:underline transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to sign in
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
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
          Set New Credentials
        </motion.div>

        <CardTitle className="text-2xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
          Reset your password
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm leading-relaxed">
          Enter a strong new password to secure your account.
        </CardDescription>
      </CardHeader>

      <CardContent className="relative z-10">
        <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin mx-auto text-violet-400" />}>
          <ResetPasswordForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
