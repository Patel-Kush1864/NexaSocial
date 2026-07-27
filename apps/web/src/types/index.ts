// ═══════════════════════════════════════════
// NexaSocial — TypeScript Entity Definitions
// ═══════════════════════════════════════════

// ── Auth ──────────────────────────────────
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

// ── User ──────────────────────────────────
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  bio?: string;
  timezone?: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'USER' | 'ADMIN';

export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  sessionId: string;
}

export interface UserSession {
  id: string;
  ipAddress: string;
  userAgent: string;
  lastActiveAt: string;
  createdAt: string;
}

// ── Workspace ─────────────────────────────
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  ownerId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WorkspaceRole = 'OWNER' | 'MANAGER' | 'CREATOR' | 'VIEWER';

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  user: User;
  joinedAt: string;
}

export interface WorkspaceWithMembers extends Workspace {
  members: WorkspaceMember[];
  memberCount: number;
}

// ── Social ────────────────────────────────
export type SocialPlatform =
  | 'YOUTUBE'
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'LINKEDIN'
  | 'X'
  | 'TWITCH'
  | 'TIKTOK';

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  platformAccountId: string;
  accountName: string;
  accountAvatar?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  isActive: boolean;
  followerCount?: number;
  workspaceId: string;
  connectedBy: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialPlatformInfo {
  id: SocialPlatform;
  name: string;
  isEnabled: boolean;
  icon: string;
}

// ── Live Streams ──────────────────────────
export type StreamStatus =
  | 'IDLE'
  | 'SCHEDULED'
  | 'LIVE'
  | 'ENDED'
  | 'FAILED'
  | 'CANCELLED';

export interface LiveStream {
  id: string;
  title: string;
  description?: string;
  status: StreamStatus;
  thumbnailUrl?: string;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  viewerCount?: number;
  peakViewerCount?: number;
  workspaceId: string;
  createdBy: string;
  platforms: StreamPlatform[];
  createdAt: string;
  updatedAt: string;
}

export interface StreamPlatform {
  id: string;
  platform: SocialPlatform;
  streamKey?: string;
  streamUrl?: string;
  status: string;
  socialAccountId: string;
}

export interface StreamDashboardStats {
  totalStreams: number;
  liveNow: number;
  scheduledToday: number;
  totalViewers: number;
  averageDuration: number;
}

// ── Notifications ─────────────────────────
export type NotificationType =
  | 'INFO'
  | 'SUCCESS'
  | 'WARNING'
  | 'ERROR'
  | 'STREAM_STARTED'
  | 'STREAM_ENDED'
  | 'MEMBER_JOINED'
  | 'MEMBER_LEFT'
  | 'SOCIAL_CONNECTED'
  | 'SOCIAL_DISCONNECTED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'SUBSCRIPTION_EXPIRING';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  userId: string;
  workspaceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ── Subscriptions & Plans ─────────────────
export type PlanTier = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';

export interface Plan {
  id: string;
  name: string;
  tier: PlanTier;
  price: number;
  currency: string;
  interval: 'MONTHLY' | 'YEARLY';
  features: PlanFeature[];
  maxWorkspaces: number;
  maxMembers: number;
  maxSocialAccounts: number;
  maxStreams: number;
  isActive: boolean;
  createdAt: string;
}

export interface PlanFeature {
  name: string;
  included: boolean;
  limit?: number;
}

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'PAST_DUE'
  | 'TRIALING';

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan: Plan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  cancelledAt?: string;
  paymentReference?: string;
  createdAt: string;
}

// ── Payments ──────────────────────────────
export type PaymentGateway = 'STRIPE' | 'RAZORPAY';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  status: PaymentStatus;
  planId: string;
  createdAt: string;
}

// ── Dashboard ─────────────────────────────
export interface DashboardSummary {
  totalFollowers: number;
  engagementRate: number;
  scheduledPosts: number;
  activeStreams: number;
  connectedAccounts: number;
  recentActivity: ActivityItem[];
}

export interface DashboardStatistics {
  followerGrowth: ChartDataPoint[];
  engagementOverTime: ChartDataPoint[];
  platformBreakdown: PlatformStat[];
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface PlatformStat {
  platform: SocialPlatform;
  followers: number;
  engagement: number;
  percentage: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ── Admin ─────────────────────────────────
export interface AdminDashboardSummary {
  totalUsers: number;
  totalWorkspaces: number;
  totalRevenue: number;
  activeStreams: number;
  newUsersToday: number;
  systemHealth: SystemHealth;
}

export interface SystemHealth {
  database: 'UP' | 'DOWN';
  redis: 'UP' | 'DOWN';
  queue: 'UP' | 'DOWN';
  storage: 'UP' | 'DOWN';
  uptime: number;
}

// ── Common ────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

export interface SuccessResponse {
  success: boolean;
  message?: string;
}
