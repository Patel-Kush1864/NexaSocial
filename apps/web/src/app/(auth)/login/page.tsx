'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';
import { loginSchema, type LoginFormValues } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  MailOpen,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { login, isLoginPending } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlToken = new URLSearchParams(window.location.search).get('token');
      const storedToken = localStorage.getItem('pending_invitation_token');
      const activeToken = urlToken || storedToken || null;
      if (activeToken) {
        setInvitationToken(activeToken);
        localStorage.setItem('pending_invitation_token', activeToken);
      }
    }
  }, []);

  const form = useForm<LoginFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(loginSchema as any),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data);
    } catch {
      // Handled by hook error toast
    }
  };

  return (
    <Card className="glass-panel border-border/60 shadow-2xl relative overflow-hidden backdrop-blur-2xl bg-background/80 rounded-2xl">
      {/* Decorative Gradient Background Glow Pill */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="space-y-3 text-center sm:text-left pb-4 relative z-10">
        {invitationToken ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 w-fit mx-auto sm:mx-0 backdrop-blur-md"
          >
            <MailOpen className="w-3.5 h-3.5 text-emerald-400" />
            Team Invitation Pending
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20 w-fit mx-auto sm:mx-0 backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            Command Deck Access
          </motion.div>
        )}

        <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
          {invitationToken ? 'Workspace Invitation' : 'Welcome back'}
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm leading-relaxed">
          {invitationToken
            ? 'Please log in to accept your workspace invitation.'
            : 'Enter your credentials to access your NexaSocial multi-platform command center.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="relative z-10 pt-1">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Address */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-foreground/90">
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

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground/90">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-violet-400 hover:text-violet-300 hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
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

          {/* Action Submit Button */}
          <Button
            type="submit"
            disabled={isLoginPending}
            className="w-full h-12 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-500 text-white font-bold shadow-xl shadow-violet-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl cursor-pointer"
          >
            {isLoginPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in to Dashboard...
              </>
            ) : (
              <>
                Sign in to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          {/* Quick Security Badge */}
          <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-bit Encrypted Session • TLS 1.3 Secure</span>
          </div>

          {/* Sign Up Link */}
          <div className="text-center text-xs text-muted-foreground pt-3 border-t border-border/40">
            Don&apos;t have an account yet?{' '}
            <Link
              href="/register"
              className="font-bold text-violet-400 hover:text-violet-300 hover:underline transition-colors"
            >
              Sign up for free
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
