'use client';

import { Suspense } from 'react';
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
import { Loader2, ArrowLeft, KeyRound } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { resetPassword, isResetPending } = useAuth();

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
      <div className="text-center space-y-4">
        <p className="text-sm text-destructive font-medium">
          Invalid or missing password reset token.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">New Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Min 8 chars, 1 upper, 1 num"
          autoComplete="new-password"
          {...form.register('password')}
          className="bg-background/50"
        />
        {form.formState.errors.password && (
          <p className="text-xs text-destructive font-medium">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Re-enter new password"
          autoComplete="new-password"
          {...form.register('confirmPassword')}
          className="bg-background/50"
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-xs text-destructive font-medium">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isResetPending}
        className="w-full h-11 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 font-semibold shadow-lg shadow-violet-500/20"
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
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Card className="glass-panel border-border/60 shadow-2xl">
      <CardHeader className="space-y-2 text-center sm:text-left">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Reset your password
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          Enter a strong new password for your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin mx-auto" />}>
          <ResetPasswordForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
