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
import { Loader2, ArrowLeft, Send, Mail, KeyRound, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const { forgotPassword, isForgotPending } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
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
          Account Recovery
        </motion.div>

        <CardTitle className="text-2xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
          {isSubmitted ? 'Check your inbox' : 'Forgot password?'}
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm leading-relaxed">
          {isSubmitted
            ? `We've sent a password reset link to ${form.getValues('email')}. Please check your inbox.`
            : 'Enter your email address and we will send you a secure link to reset your password.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="relative z-10">
        {isSubmitted ? (
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={() => setIsSubmitted(false)}
              className="w-full h-11 border-white/10 bg-white/5 hover:bg-violet-500/10 hover:border-violet-500/30 rounded-xl"
            >
              Didn&apos;t receive email? Try again
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
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">
                Email address
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  {...form.register('email')}
                  className="pl-10 h-11 bg-background/50 border-border/60 focus-visible:ring-violet-500 focus-visible:border-violet-500 rounded-xl"
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-xs text-destructive font-medium">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isForgotPending}
              className="w-full h-12 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-500 text-white font-bold shadow-xl shadow-violet-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl cursor-pointer"
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
        )}
      </CardContent>
    </Card>
  );
}
