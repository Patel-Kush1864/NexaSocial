// ═══════════════════════════════════════════
// NexaSocial — TypeScript Entity Definitions
// ═══════════════════════════════════════════

// ── Auth ──────────────────────────────────
export type Scope = "PLATFORM" | "WORKSPACE";

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  role?: string;
  scope?: Scope;
  permissions?: string[];
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
  scope?: Scope;
  isActive: boolean;
  isEmailVerified: boolean;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN" | "WORKSPACE_OWNER" | "MANAGER" | "CREATOR" | "VIEWER";

export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  scope?: Scope;
  permissions: string[];
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

export type WorkspaceRole = "OWNER" | "MANAGER" | "CREATOR" | "VIEWER";

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
  | "YOUTUBE"
  | "FACEBOOK"
  | "INSTAGRAM"
  | "X";

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  platformName?: string;
  platformAccountId: string;
  platformUserId?: string;
  accountName: string;
  name?: string;
  accountAvatar?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  isActive: boolean;
  followerCount?: number;
  metadata?: Record<string, any>;
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

export interface FacebookAccountResponse {
  id: string;
  userId: string;
  provider: string;
  providerUserId: string;
  providerUserName: string;
  providerEmail?: string;
  pageId?: string;
  pageName?: string;
  status: string;
  connectedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ── Live Streams ──────────────────────────
export type StreamStatus =
  "IDLE" | "SCHEDULED" | "LIVE" | "ENDED" | "FAILED" | "CANCELLED";

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
  platform?: SocialPlatform;
  platformName?: string;
  platformStreamId?: string;
  streamKey?: string;
  streamUrl?: string;
  viewerUrl?: string;
  status: string;
  socialAccountId?: string;
  connectedAccount?: SocialAccount;
  // Facebook 3-step workflow fields:
  facebookLiveVideoId?: string;
  facebookPageId?: string;
  sourceStatus?: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';
  metadataStatus?: 'PENDING' | 'UPDATING' | 'COMPLETED' | 'FAILED';
  publishStatus?: 'NOT_STARTED' | 'REQUESTED' | 'PUBLISHED' | 'FAILED';
  sourceConnected?: boolean;
  metadataCompleted?: boolean;
  publishRequested?: boolean;
  facebookStatus?: string;
  facebookLastError?: string;
  facebookLastErrorCode?: string;
  sourceConnectedAt?: string;
  metadataCompletedAt?: string;
  publishedAt?: string;
}

export interface FacebookWorkflowStatusResponse {
  sourceConnected: boolean;
  metadataCompleted: boolean;
  publishRequested: boolean;
  sourceStatus?: string;
  metadataStatus?: string;
  publishStatus?: string;
  facebookStatus?: string;
  facebookLiveVideoId?: string;
  facebookPageId?: string;
  streamUrl?: string;
  streamKey?: string;
  viewerUrl?: string;
  producerUrl?: string;
  isRelayActive?: boolean;
  sourceConnectedAt?: string;
  metadataCompletedAt?: string;
  publishedAt?: string;
  facebookLastError?: string;
  facebookLastErrorCode?: string;
  message?: string;
}

export interface InstagramWorkflowStatusResponse {
  configured: boolean;
  platformId?: string;
  status?: string;
  streamUrl?: string;
  isRelayActive?: boolean;
  sourceConnected?: boolean;
  isConfirmedLive?: boolean;
  producerUrl?: string;
  viewerUrl?: string;
  publishedAt?: string;
  message?: string;
  success?: boolean;
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
  | "INFO"
  | "SUCCESS"
  | "WARNING"
  | "ERROR"
  | "STREAM_STARTED"
  | "STREAM_ENDED"
  | "MEMBER_JOINED"
  | "MEMBER_LEFT"
  | "SOCIAL_CONNECTED"
  | "SOCIAL_DISCONNECTED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "SUBSCRIPTION_EXPIRING";

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
export type PlanTier = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

export interface Plan {
  id: string;
  name: string;
  tier: PlanTier;
  price: number;
  currency: string;
  interval: "MONTHLY" | "YEARLY";
  features: PlanFeature[];
  maxWorkspaces: number;
  maxMembers: number;
  maxSocialAccounts: number;
  maxStreams: number;
  isActive: boolean;
  createdAt: string;
}

export type PlanStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type BillingCycle = "MONTHLY" | "YEARLY" | "QUARTERLY";
export type BillingType = "RECURRING" | "ONE_TIME";

export interface AdminPlan {
  id: string;
  name: string;
  code?: string;
  description?: string;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  billingType?: BillingType;
  durationDays?: number | null;
  isPopular?: boolean;
  displayOrder?: number;
  workspaceLimit: number;
  teamMemberLimit: number;
  socialAccountLimit: number;
  liveStreamLimit: number;
  maxStreams?: number;
  storageLimit: number;
  maxScheduledPosts?: number;
  aiLimit?: number;
  analytics: boolean;
  scheduling: boolean;
  aiFeatures: boolean;
  liveStreaming?: boolean;
  mediaLibrary?: boolean;
  multiPlatformStreaming?: boolean;
  apiAccess: boolean;
  customBranding?: boolean;
  support: string;
  status: PlanStatus;
  subscriberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanFeature {
  name: string;
  included: boolean;
  limit?: number;
}

export type SubscriptionStatus =
  "ACTIVE" | "CANCELLED" | "EXPIRED" | "PAST_DUE" | "TRIALING";

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

export interface PlanFeaturesMap {
  workspaces: number;
  socialAccounts: number;
  teamMembers: number;
  liveStreaming: boolean;
  maxStreams?: number;
  analytics: boolean;
  aiFeatures: boolean;
  aiLimit?: number;
  prioritySupport: boolean;
  storageGb: number;
  apiAccess: boolean;
  customBranding: boolean;
  streamScheduling: boolean;
  maxScheduledPosts?: number;
  multiPlatformStreaming: boolean;
  mediaLibrary?: boolean;
}

export interface SubscriptionEntitlements {
  hasActiveSubscription: boolean;
  status: string;
  planId: string | null;
  planName: string | null;
  planCode?: string | null;
  planPrice: number;
  currency?: string;
  billingPeriod: string | null;
  durationDays?: number | null;
  isPopular?: boolean;
  startDate: string | null;
  endDate: string | null;
  cancelAtPeriodEnd: boolean;
  features: PlanFeaturesMap | null;
  latestPayment: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    gateway: string;
    createdAt: string;
  } | null;
}

// ── Payments ──────────────────────────────
export type PaymentGateway = "STRIPE" | "RAZORPAY";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

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
export interface KpiMetric {
  value: number;
  change: number;
  direction: 'up' | 'down' | 'neutral';
  currency?: string;
}

export interface DashboardSummary {
  workspace?: { id: string; name: string; slug?: string; };
  subscription?: string;
  totalFollowers: number;
  engagementRate: number;
  scheduledPosts: number;
  activeStreams: number;
  connectedAccounts: number;
  scheduledStreams?: number;
  liveStreams?: number;
  teamMembers?: number;
  notifications?: number;
  recentActivity?: ActivityItem[];
}

export interface PlatformDashboardSummary extends Omit<DashboardSummary, 'connectedAccounts' | 'liveStreams'> {
  totalUsers?: KpiMetric;
  workspaces?: KpiMetric;
  subscriptions?: KpiMetric;
  revenue?: KpiMetric;
  connectedAccounts?: KpiMetric;
  liveStreams?: KpiMetric;
  activeUsers?: KpiMetric;
  failedPayments?: KpiMetric;
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

export interface PlatformActivity {
  id: string;
  userId?: string;
  workspaceId?: string;
  action: string;
  module: string; // Used as category
  description?: string;
  metadata?: Record<string, unknown>;
  entityType?: string;
  entityId?: string;
  created_at: string;
  user?: { id: string; name: string; email: string };
  workspace?: { id: string; name: string };
}

export interface PlatformActivityResponse {
  data: PlatformActivity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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
  database: "UP" | "DOWN";
  redis: "UP" | "DOWN";
  queue: "UP" | "DOWN";
  storage: "UP" | "DOWN";
  uptime: number;
}

export interface SystemHealthResult {
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';
  checkedAt: string;
  services: {
    name: string;
    status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';
    responseTimeMs: number | null;
    uptimePercentage: number | string;
    checkedAt: string;
    errorCount: number;
  }[];
  queue?: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  database?: {
    status: string;
    responseTimeMs: number | null;
    activeConnections?: number;
  };
  runtime?: {
    memory: {
      rssBytes: number;
      heapUsedBytes: number;
      heapTotalBytes: number;
    };
    cpu: {
      loadAvg: number[];
    };
    uptimeSeconds: number;
  };
  storage?: {
    status: string;
    usedBytes: number | null;
    freeBytes: number | null;
    totalBytes: number | null;
  };
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
  details?: Array<{ field?: string; message?: string }>;
}

export interface SuccessResponse {
  success: boolean;
  message?: string;
}
