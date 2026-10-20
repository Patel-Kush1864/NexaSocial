export type UserAnalyticsRange = '7d' | '30d' | '3m' | '6m' | '1y';

export interface UserAnalyticsSummary {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  suspendedUsers: number;
}

export interface UserGrowthPoint {
  date: string;
  users: number;
}

export interface UserAnalyticsResponse {
  range: UserAnalyticsRange;
  summary: UserAnalyticsSummary;
  growth: UserGrowthPoint[];
}

export type WorkspaceAnalyticsRange = '7d' | '30d' | '3m' | '6m' | '1y';

export interface WorkspaceAnalyticsSummary {
  totalWorkspaces: number;
  activeWorkspaces: number;
  suspendedWorkspaces: number;
  newWorkspaces: number;
}

export interface WorkspaceGrowthPoint {
  date: string;
  workspaces: number;
}

export interface WorkspaceAnalyticsResponse {
  range: WorkspaceAnalyticsRange;
  summary: WorkspaceAnalyticsSummary;
  growth: WorkspaceGrowthPoint[];
}

export type SubscriptionAnalyticsRange = '7d' | '30d' | '3m' | '6m' | '1y';

export interface SubscriptionAnalyticsSummary {
  active: number;
  trialing: number;
  pastDue: number;
  cancelled: number;
  expired: number;
}

export interface SubscriptionGrowthPoint {
  date: string;
  subscriptions: number;
}

export interface SubscriptionAnalyticsResponse {
  range: SubscriptionAnalyticsRange;
  summary: SubscriptionAnalyticsSummary;
  growth: SubscriptionGrowthPoint[];
}

export type RevenueAnalyticsRange = '7d' | '30d' | '3m' | '6m' | '1y';

export interface RevenueAnalyticsSummary {
  todayRevenue: number;
  monthRevenue: number;
  yearRevenue: number;
  refunds: number;
  failedPayments: number;
}

export interface RevenueGrowthPoint {
  date: string;
  revenue: number;
}

export interface RevenueAnalyticsResponse {
  range: RevenueAnalyticsRange;
  summary: RevenueAnalyticsSummary;
  growth: RevenueGrowthPoint[];
}

export type SocialPlatform =
  | 'YOUTUBE'
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'X';

export type PlatformStatus =
  | 'OPERATIONAL'
  | 'DEGRADED'
  | 'MAJOR_ISSUES'
  | 'UNAVAILABLE'
  | 'UNKNOWN';

export interface SocialPlatformAnalytics {
  platform: SocialPlatform;
  displayName: string;
  connectedAccounts: number;
  activeConnections: number;
  connectionErrors: number;
  lastSyncAt: string | null;
  status: PlatformStatus;
}

export interface SocialPlatformUsagePoint {
  platform: SocialPlatform;
  connectedAccounts: number;
}

export interface SocialPlatformAnalyticsResponse {
  platforms: SocialPlatformAnalytics[];
  usage: SocialPlatformUsagePoint[];
}

export type LiveStreamStatus = 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';

export interface LiveStreamSummary {
  totalStreams: number;
  scheduled: number;
  liveNow: number;
  completed: number;
  failed: number;
  cancelled: number;
}

export interface LiveStreamAnalyticsItem {
  id: string;
  title: string;
  status: LiveStreamStatus;
  workspace: {
    id: string;
    name: string;
  };
  platforms: SocialPlatform[];
  startedAt: string | null;
}

export interface LiveStreamAnalyticsResponse {
  summary: LiveStreamSummary;
  liveNow: LiveStreamAnalyticsItem[];
}
