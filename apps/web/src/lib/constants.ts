// ═══════════════════════════════════════════
// NexaSocial — App Constants & Configuration
// ═══════════════════════════════════════════

import type { SocialPlatform } from '@/types';

// ── API Routes ────────────────────────────
export const API_ROUTES = {
  // Auth
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_REFRESH: '/api/auth/refresh',
  AUTH_ME: '/api/auth/me',
  AUTH_FORGOT_PASSWORD: '/api/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/api/auth/reset-password',
  AUTH_VERIFY_EMAIL: '/api/auth/verify-email',

  // Users
  USERS_PROFILE: '/api/users/profile',
  USERS_AVATAR: '/api/users/profile/avatar',
  USERS_PASSWORD: '/api/users/profile/password',
  USERS_SESSIONS: '/api/users/sessions',

  // Workspaces
  WORKSPACES: '/api/workspaces',
  WORKSPACES_SWITCH: '/api/workspaces/switch',

  // Social
  SOCIAL_PLATFORMS: '/api/social/platforms',
  SOCIAL_ACCOUNTS: '/api/social/accounts',
  SOCIAL_CONNECT: '/api/social/connect',

  // Livestreams
  LIVESTREAMS: '/api/livestreams',
  LIVESTREAMS_HISTORY: '/api/livestreams/history',
  LIVESTREAMS_DASHBOARD: '/api/livestreams/dashboard',

  // Dashboard
  DASHBOARD: '/api/dashboard',
  DASHBOARD_STATS: '/api/dashboard/statistics',
  DASHBOARD_WIDGETS: '/api/dashboard/widgets',

  // Notifications
  NOTIFICATIONS: '/api/notifications',
  NOTIFICATIONS_UNREAD: '/api/notifications/unread-count',
  NOTIFICATIONS_READ_ALL: '/api/notifications/read-all',

  // Subscriptions
  SUBSCRIPTIONS_CURRENT: '/api/subscriptions/current',
  SUBSCRIPTIONS_HISTORY: '/api/subscriptions/history',
  SUBSCRIPTIONS_PURCHASE: '/api/subscriptions/purchase',
  SUBSCRIPTIONS_CANCEL: '/api/subscriptions/cancel',
  SUBSCRIPTIONS_UPGRADE: '/api/subscriptions/upgrade',
  SUBSCRIPTIONS_DOWNGRADE: '/api/subscriptions/downgrade',
  SUBSCRIPTIONS_RENEW: '/api/subscriptions/renew',

  // Payments
  PAYMENTS_CREATE: '/api/payments/create-order',
  PAYMENTS_VERIFY: '/api/payments/verify',
  PAYMENTS_HISTORY: '/api/payments/history',

  // Plans
  PLANS: '/api/plans',

  // Admin
  ADMIN_DASHBOARD: '/api/admin/dashboard',
  ADMIN_USERS: '/api/admin/users',
  ADMIN_WORKSPACES: '/api/admin/workspaces',
  ADMIN_PLANS: '/api/admin/plans',
  ADMIN_PAYMENTS: '/api/admin/payments',
  ADMIN_REFUNDS: '/api/admin/refunds',
  ADMIN_SOCIAL_PLATFORMS: '/api/admin/social-platforms',
  ADMIN_SYSTEM_HEALTH: '/api/admin/system/health',

  // Activity & Audit
  ACTIVITY: '/api/activity',
  AUDIT: '/api/audit',
} as const;

// ── Platform Configuration ────────────────
export const PLATFORM_CONFIG: Record<
  SocialPlatform,
  {
    name: string;
    color: string;
    bgColor: string;
    icon: string;
    gradient: string;
  }
> = {
  YOUTUBE: {
    name: 'YouTube',
    color: '#FF0000',
    bgColor: 'rgba(255, 0, 0, 0.1)',
    icon: '🎬',
    gradient: 'from-red-500 to-red-700',
  },
  FACEBOOK: {
    name: 'Facebook',
    color: '#1877F2',
    bgColor: 'rgba(24, 119, 242, 0.1)',
    icon: '📘',
    gradient: 'from-blue-500 to-blue-700',
  },
  INSTAGRAM: {
    name: 'Instagram',
    color: '#E4405F',
    bgColor: 'rgba(228, 64, 95, 0.1)',
    icon: '📸',
    gradient: 'from-pink-500 via-purple-500 to-orange-500',
  },
  LINKEDIN: {
    name: 'LinkedIn',
    color: '#0A66C2',
    bgColor: 'rgba(10, 102, 194, 0.1)',
    icon: '💼',
    gradient: 'from-blue-600 to-blue-800',
  },
  X: {
    name: 'X (Twitter)',
    color: '#000000',
    bgColor: 'rgba(0, 0, 0, 0.1)',
    icon: '𝕏',
    gradient: 'from-gray-700 to-gray-900',
  },
  TWITCH: {
    name: 'Twitch',
    color: '#9146FF',
    bgColor: 'rgba(145, 70, 255, 0.1)',
    icon: '🎮',
    gradient: 'from-purple-500 to-purple-700',
  },
  TIKTOK: {
    name: 'TikTok',
    color: '#000000',
    bgColor: 'rgba(0, 0, 0, 0.1)',
    icon: '🎵',
    gradient: 'from-pink-500 via-black to-cyan-500',
  },
};

// ── WebSocket Events ──────────────────────
export const WS_EVENTS = {
  // Notifications
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',

  // Streams
  STREAM_STATUS_CHANGED: 'stream:status_changed',
  STREAM_VIEWER_COUNT: 'stream:viewer_count',
  STREAM_STARTED: 'stream:started',
  STREAM_ENDED: 'stream:ended',

  // Workspace
  WORKSPACE_MEMBER_JOINED: 'workspace:member_joined',
  WORKSPACE_MEMBER_LEFT: 'workspace:member_left',
  WORKSPACE_UPDATED: 'workspace:updated',

  // Social
  SOCIAL_ACCOUNT_CONNECTED: 'social:account_connected',
  SOCIAL_ACCOUNT_DISCONNECTED: 'social:account_disconnected',
  SOCIAL_SYNC_COMPLETE: 'social:sync_complete',
} as const;

// ── Plan Tier Configuration ───────────────
export const PLAN_TIER_CONFIG = {
  FREE: {
    label: 'Free',
    color: 'text-muted-foreground',
    badgeVariant: 'secondary' as const,
    gradient: 'from-gray-400 to-gray-600',
  },
  STARTER: {
    label: 'Starter',
    color: 'text-blue-500',
    badgeVariant: 'default' as const,
    gradient: 'from-blue-400 to-blue-600',
  },
  PRO: {
    label: 'Pro',
    color: 'text-violet-500',
    badgeVariant: 'default' as const,
    gradient: 'from-violet-400 to-violet-600',
  },
  ENTERPRISE: {
    label: 'Enterprise',
    color: 'text-amber-500',
    badgeVariant: 'default' as const,
    gradient: 'from-amber-400 to-amber-600',
  },
} as const;

// ── Navigation Items ──────────────────────
export const DASHBOARD_NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Social Accounts', href: '/social', icon: 'Share2' },
  { label: 'Live Streams', href: '/streams', icon: 'Radio' },
  { label: 'Analytics', href: '/dashboard/analytics', icon: 'BarChart3' },
  { label: 'Workspaces', href: '/workspaces', icon: 'Building2' },
  { label: 'Notifications', href: '/notifications', icon: 'Bell' },
  { label: 'Billing', href: '/billing', icon: 'CreditCard' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
] as const;

export const ADMIN_NAV_ITEMS = [
  { label: 'Overview', href: '/admin', icon: 'LayoutDashboard' },
  { label: 'Users', href: '/admin/users', icon: 'Users' },
  { label: 'Workspaces', href: '/admin/workspaces', icon: 'Building2' },
  { label: 'Plans', href: '/admin/plans', icon: 'Package' },
  { label: 'Payments', href: '/admin/payments', icon: 'CreditCard' },
  { label: 'System Health', href: '/admin/system', icon: 'Activity' },
] as const;

// ── App Config ────────────────────────────
export const APP_CONFIG = {
  name: 'NexaSocial',
  description: 'Enterprise Social Media & Live Streaming Management Platform',
  version: '1.0.0',
  defaultTheme: 'dark' as const,
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
} as const;
