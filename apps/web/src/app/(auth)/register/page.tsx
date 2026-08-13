'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';
import { registerSchema, type RegisterFormValues } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  ArrowRight,
  CheckCircle,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const { register, isRegisterPending } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(registerSchema as any),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const watchPassword = form.watch('password') || '';

  // Password validation rules for real-time strength meter
  const passwordRules = [
    { label: 'At least 8 characters', valid: watchPassword.length >= 8 },
    { label: 'One uppercase letter (A-Z)', valid: /[A-Z]/.test(watchPassword) },
    { label: 'One lowercase letter (a-z)', valid: /[a-z]/.test(watchPassword) },
    { label: 'One number (0-9)', valid: /[0-9]/.test(watchPassword) },
    { label: 'One special character (!@#$%)', valid: /[^A-Za-z0-9]/.test(watchPassword) },
  ];

  const passedRulesCount = passwordRules.filter((r) => r.valid).length;
  const strengthPercentage = (passedRulesCount / passwordRules.length) * 100;

  const getStrengthColor = () => {
    if (strengthPercentage <= 20) return 'bg-rose-500';
    if (strengthPercentage <= 60) return 'bg-amber-500';
    if (strengthPercentage <= 80) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber || undefined,
        password: data.password,
      });
    } catch {
      // Handled by useAuth error toast
    }
  };

  return (
    <Card className="glass-panel border-border/60 shadow-2xl relative overflow-hidden backdrop-blur-2xl bg-background/80 rounded-2xl">
      {/* Background Orbs Glow */}
      <div className="absolute -top-24 -right-24 w-56 h-56 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="space-y-3 text-center sm:text-left pb-3 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20 w-fit mx-auto sm:mx-0 backdrop-blur-md"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          14-Day Unlimited Free Trial • No Credit Card
        </motion.div>

        <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
          Create your NexaSocial account
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm leading-relaxed">
          Stream everywhere, publish smarter, and manage audience analytics in one command center.
        </CardDescription>
      </CardHeader>

      <CardContent className="relative z-10 space-y-5">
        {/* Quick Social Authentication Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-11 border-white/10 bg-white/5 hover:bg-violet-500/10 hover:border-violet-500/30 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            onClick={() => {}}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
              />
            </svg>
            <span>Google</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-11 border-white/10 bg-white/5 hover:bg-violet-500/10 hover:border-violet-500/30 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            onClick={() => {}}
          >
            <svg className="w-4 h-4 fill-current text-foreground" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>GitHub</span>
          </Button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-border/50 w-full" />
          <span className="bg-background/90 px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider absolute">
            Or register with email
          </span>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* First Name */}
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs font-semibold">
                First name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="firstName"
                  placeholder="Sarah"
                  {...form.register('firstName')}
                  className="pl-10 h-10 bg-background/50 border-border/60 focus-visible:ring-violet-500 focus-visible:border-violet-500 rounded-xl"
                />
              </div>
              {form.formState.errors.firstName && (
                <p className="text-xs text-destructive font-medium">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-xs font-semibold">
                Last name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="lastName"
                  placeholder="Connor"
                  {...form.register('lastName')}
                  className="pl-10 h-10 bg-background/50 border-border/60 focus-visible:ring-violet-500 focus-visible:border-violet-500 rounded-xl"
                />
              </div>
              {form.formState.errors.lastName && (
                <p className="text-xs text-destructive font-medium">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold">
              Email address <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="sarah.connor@example.com"
                autoComplete="email"
                {...form.register('email')}
                className="pl-10 h-10 bg-background/50 border-border/60 focus-visible:ring-violet-500 focus-visible:border-violet-500 rounded-xl"
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-xs text-destructive font-medium">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Phone Number (Optional) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="phoneNumber" className="text-xs font-semibold">
                Phone number
              </Label>
              <span className="text-[10px] text-muted-foreground">(Optional)</span>
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1 (555) 000-0000"
                autoComplete="tel"
                {...form.register('phoneNumber')}
                className="pl-10 h-10 bg-background/50 border-border/60 focus-visible:ring-violet-500 focus-visible:border-violet-500 rounded-xl"
              />
            </div>
            {form.formState.errors.phoneNumber && (
              <p className="text-xs text-destructive font-medium">
                {form.formState.errors.phoneNumber.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold">
              Password <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 chars, 1 upper, 1 num, 1 special"
                autoComplete="new-password"
                {...form.register('password')}
                className="pl-10 pr-10 h-10 bg-background/50 border-border/60 focus-visible:ring-violet-500 focus-visible:border-violet-500 rounded-xl"
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

            {/* Password Strength Indicator */}
            {watchPassword.length > 0 && (
              <div className="space-y-2 pt-1.5">
                <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                    style={{ width: `${strengthPercentage}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  {passwordRules.map((rule, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-1.5 ${
                        rule.valid ? 'text-emerald-400 font-medium' : 'text-muted-foreground'
                      }`}
                    >
                      <CheckCircle
                        className={`w-3 h-3 ${
                          rule.valid ? 'text-emerald-400 fill-emerald-400/20' : 'text-muted-foreground/40'
                        }`}
                      />
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs font-semibold">
              Confirm password <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                {...form.register('confirmPassword')}
                className="pl-10 pr-10 h-10 bg-background/50 border-border/60 focus-visible:ring-violet-500 focus-visible:border-violet-500 rounded-xl"
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

          {/* Terms and Conditions Checkbox */}
          <div className="flex items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              id="acceptTerms"
              {...form.register('acceptTerms')}
              className="mt-0.5 rounded border-border text-violet-600 focus:ring-violet-500 h-4 w-4 bg-background/50 accent-violet-600 cursor-pointer"
            />
            <label htmlFor="acceptTerms" className="text-xs text-muted-foreground leading-tight cursor-pointer">
              I agree to the{' '}
              <Link href="#" className="underline text-foreground hover:text-violet-400 transition-colors">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="#" className="underline text-foreground hover:text-violet-400 transition-colors">
                Privacy Policy
              </Link>
            </label>
          </div>
          {form.formState.errors.acceptTerms && (
            <p className="text-xs text-destructive font-medium">
              {form.formState.errors.acceptTerms.message}
            </p>
          )}

          {/* Submit Action Button */}
          <Button
            type="submit"
            disabled={isRegisterPending}
            className="w-full h-12 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-500 text-white font-bold shadow-xl shadow-violet-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl cursor-pointer"
          >
            {isRegisterPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create Free Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          {/* Platform Feature Highlights */}
          <div className="space-y-2 pt-3 border-t border-border/40">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Full access to 7 social platforms (YouTube, Facebook, X, etc.)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Multi-destination 1080p live video broadcasting & AI scheduler</span>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="text-center text-xs text-muted-foreground pt-2">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-bold text-violet-400 hover:text-violet-300 hover:underline transition-colors"
            >
              Sign in to Dashboard
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
