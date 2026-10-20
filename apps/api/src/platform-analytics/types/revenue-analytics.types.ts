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
