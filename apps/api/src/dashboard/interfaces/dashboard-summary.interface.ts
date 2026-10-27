/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
export interface DashboardSummaryResponse {
  workspace: {
    id: string;
    name: string;
    slug?: string;
  };
  subscription: string;
  connectedAccounts: number | any;
  scheduledStreams: number;
  liveStreams: number | any;
  teamMembers: number;
  notifications: number;

  // Real KPI fields
  totalFollowers: number;
  hasFollowerData?: boolean;
  engagementRate: number | null;
  hasEngagementData?: boolean;
  scheduledPosts: number;
  activeStreams: number;

  // Platform Dashboard fields
  totalUsers?: any;
  workspaces?: any;
  subscriptions?: any;
  revenue?: any;
  activeUsers?: any;
  failedPayments?: any;
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface PlatformStat {
  platform: string;
  followers: number;
  engagement: number;
  percentage: number;
}

export interface DashboardStatisticsResponse {
  totalStreams: number;
  activeStreams: number;
  completedStreams: number;
  failedStreams: number;
  connectedAccounts: number;
  teamMembers: number;

  followerGrowth: ChartDataPoint[];
  engagementOverTime: ChartDataPoint[];
  platformBreakdown: PlatformStat[];
}

export interface DashboardOverviewResponse {
  workspace: {
    id: string;
    name: string;
    slug?: string;
  };
  subscription: string;
  kpis: {
    totalFollowers: {
      value: number;
      hasData: boolean;
      change: string | null;
      isPositive: boolean;
      subtitle: string;
    };
    engagementRate: {
      value: number | null;
      hasData: boolean;
      change: string | null;
      isPositive: boolean;
      subtitle: string;
    };
    connectedAccounts: {
      value: number;
      activeConnections: number;
      subtitle: string;
    };
    activeStreams: {
      value: number;
      liveNow: number;
      subtitle: string;
    };
  };
  analytics: {
    range: string;
    followerGrowth: ChartDataPoint[];
    hasAnalyticsData: boolean;
  };
  platformBreakdown: PlatformStat[];
  liveStreams: {
    active: Array<{
      id: string;
      title: string;
      status: string;
      platforms: string[];
      startedAt?: Date | string | null;
    }>;
    scheduled: Array<{
      id: string;
      title: string;
      status: string;
      platforms: string[];
      scheduledAt?: Date | string | null;
    }>;
    total: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    module: string;
    description?: string;
    createdAt: Date | string;
    metadata?: any;
  }>;
  dataAvailability: {
    followersAvailable: boolean;
    engagementAvailable: boolean;
    analyticsAvailable: boolean;
    connectedAccountsCount: number;
    liveStreamsCount: number;
    recentActivityCount: number;
  };
}

export interface DashboardWidgetData {
  widgetName: string;
  title: string;
  data: any;
}
