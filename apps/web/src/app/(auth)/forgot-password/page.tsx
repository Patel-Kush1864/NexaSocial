'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const { forgotPassword, isForgotPending } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    // Cast schema to any to guarantee IDE type-check compatibility across Zod versions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(forgotPasswordSchema as any),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      await forgotPassword(data.email);
      setIsSubmitted(true);
    } catch {
      // Handled by toast
    }
  };

  return (
    <Card className="glass-panel border-border/60 shadow-2xl">
      <CardHeader className="space-y-2 text-center sm:text-left">
        <CardTitle className="text-2xl font-bold tracking-tight">
          {isSubmitted ? 'Check your email' : 'Forgot password?'}
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          {isSubmitted
            ? `We've sent a password reset link to ${form.getValues('email')}. Please check your inbox.`
            : 'Enter your email address and we will send you a link to reset your password.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSubmitted ? (
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={() => setIsSubmitted(false)}
              className="w-full h-11"
            >
              Didn&apos;t receive email? Try again
            </Button>
            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back to sign in
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                autoComplete="email"
                {...form.register('email')}
                className="bg-background/50"
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive font-medium">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isForgotPending}
              className="w-full h-11 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 font-semibold shadow-lg shadow-violet-500/20"
            >
              {isForgotPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending reset link...
                </>
              ) : (
                <>
                  Send Reset Link
                  <Send className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
