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
    <Card className="glass-panel border-border/60 shadow-2xl relative overflow-hidden backdrop-blur-xl bg-background/80">
      <CardHeader className="space-y-2 text-center sm:text-left pb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 w-fit mx-auto sm:mx-0">
          <Sparkles className="w-3.5 h-3.5" />
          14-Day Unlimited Free Trial
        </div>
        <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight bg-linear-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
          Create your NexaSocial account
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          Stream everywhere, publish smarter, and manage audience analytics in one command center.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

          {/* Name Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* First Name */}
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs font-semibold">
                First name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="firstName"
                  placeholder="Sarah"
                  {...form.register('firstName')}
                  className="pl-9 bg-background/50 border-border/60 focus-visible:ring-violet-500"
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
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="lastName"
                  placeholder="Connor"
                  {...form.register('lastName')}
                  className="pl-9 bg-background/50 border-border/60 focus-visible:ring-violet-500"
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
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="sarah.connor@example.com"
                autoComplete="email"
                {...form.register('email')}
                className="pl-9 bg-background/50 border-border/60 focus-visible:ring-violet-500"
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
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+12345678901"
                autoComplete="tel"
                {...form.register('phoneNumber')}
                className="pl-9 bg-background/50 border-border/60 focus-visible:ring-violet-500"
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
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 chars, 1 upper, 1 num, 1 special"
                autoComplete="new-password"
                {...form.register('password')}
                className="pl-9 pr-10 bg-background/50 border-border/60 focus-visible:ring-violet-500"
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
              <ShieldCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                {...form.register('confirmPassword')}
                className="pl-9 pr-10 bg-background/50 border-border/60 focus-visible:ring-violet-500"
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
            className="w-full h-11 bg-linear-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:via-indigo-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all duration-200 cursor-pointer"
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
              <span>Multi-destination 1080p live video broadcasting</span>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="text-center text-xs text-muted-foreground pt-2">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-violet-400 hover:underline transition-colors"
            >
              Sign in to Dashboard
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
