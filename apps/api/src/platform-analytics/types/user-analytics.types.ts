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
