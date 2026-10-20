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

  // Added for frontend alignment
  totalFollowers: number;
  engagementRate: number;
  scheduledPosts: number;
  activeStreams: number;

  // Added for Phase 52 - Platform Dashboard Unification
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

  // Added for frontend alignment
  followerGrowth: ChartDataPoint[];
  engagementOverTime: ChartDataPoint[];
  platformBreakdown: PlatformStat[];
}

export interface DashboardWidgetData {
  widgetName: string;
  title: string;
  data: any;
}
