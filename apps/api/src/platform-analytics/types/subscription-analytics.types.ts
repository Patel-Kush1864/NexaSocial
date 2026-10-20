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
