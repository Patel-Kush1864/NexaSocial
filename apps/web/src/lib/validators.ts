// ═══════════════════════════════════════════
// NexaSocial — Zod Validation Schemas
// ═══════════════════════════════════════════

import { z } from 'zod';

// ── Auth Schemas ──────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must be at most 50 characters')
      .regex(/^[a-zA-Z\s]+$/, 'First name must contain only letters'),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must be at most 50 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Last name must contain only letters'),
    email: z.string().email('Please enter a valid email address'),
    phoneNumber: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\+?[1-9]\d{1,14}$/.test(val),
        'Phone number must be a valid E.164 phone number (10-15 digits)',
      ),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(30, 'Password must be at most 30 characters')
      .regex(/[A-Z]/, 'Must contain at least 1 uppercase letter')
      .regex(/[a-z]/, 'Must contain at least 1 lowercase letter')
      .regex(/[0-9]/, 'Must contain at least 1 number')
      .regex(/[^A-Za-z0-9]/, 'Must contain at least 1 special character'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ── Workspace Schemas ─────────────────────
export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(30, 'Slug must be at most 30 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(500).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['MANAGER', 'CREATOR', 'VIEWER'], {
    required_error: 'Please select a role',
  }),
});

// ── Stream Schemas ────────────────────────
export const createStreamSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be at most 100 characters'),
  description: z.string().max(2000, 'Description must be at most 2000 characters').optional(),
  platformAccountIds: z
    .array(z.string())
    .min(1, 'Select at least one platform'),
});

export const scheduleStreamSchema = z.object({
  scheduledAt: z.string().refine(
    (val) => {
      const date = new Date(val);
      return date > new Date();
    },
    { message: 'Scheduled time must be in the future' },
  ),
});

// ── Profile Schemas ───────────────────────
export const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  timezone: z.string().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

// ── Admin Schemas ─────────────────────────
export const createPlanSchema = z.object({
  name: z.string().min(2, 'Plan name is required'),
  tier: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']),
  price: z.number().min(0, 'Price must be 0 or greater'),
  currency: z.string().default('USD'),
  interval: z.enum(['MONTHLY', 'YEARLY']),
  maxWorkspaces: z.number().min(1),
  maxMembers: z.number().min(1),
  maxSocialAccounts: z.number().min(1),
  maxStreams: z.number().min(0),
});

// ── Type Exports ──────────────────────────
export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type CreateWorkspaceFormValues = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceFormValues = z.infer<typeof updateWorkspaceSchema>;
export type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>;
export type CreateStreamFormValues = z.infer<typeof createStreamSchema>;
export type ScheduleStreamFormValues = z.infer<typeof scheduleStreamSchema>;
export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
export type CreatePlanFormValues = z.infer<typeof createPlanSchema>;
