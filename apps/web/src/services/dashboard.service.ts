// ═══════════════════════════════════════════
// NexaSocial — Dashboard API Service
// ═══════════════════════════════════════════

import apiClient from '@/lib/api-client';
import type { DashboardSummary, DashboardStatistics } from '@/types';
import type { UserAnalyticsResponse, WorkspaceAnalyticsResponse, SubscriptionAnalyticsResponse, RevenueAnalyticsResponse, SocialPlatformAnalyticsResponse, LiveStreamAnalyticsResponse } from '@/types/analytics';

export const dashboardService = {
  async getPlatformSummary() {
    const { data } = await apiClient.get('/admin/dashboard');
    return data;
  },

  async getPlatformKpis() {
    const { data } = await apiClient.get('/admin/dashboard/kpis');
    return data;
  },

  async getUserAnalytics(range: string): Promise<UserAnalyticsResponse> {
    const { data } = await apiClient.get<UserAnalyticsResponse>('/platform/analytics/users', {
      params: { range },
    });
    return data;
  },

  async getWorkspaceAnalytics(range: string): Promise<WorkspaceAnalyticsResponse> {
    const { data } = await apiClient.get<WorkspaceAnalyticsResponse>('/platform/analytics/workspaces', {
      params: { range },
    });
    return data;
  },

  async getSubscriptionAnalytics(range: string): Promise<SubscriptionAnalyticsResponse> {
    const { data } = await apiClient.get<SubscriptionAnalyticsResponse>('/platform/analytics/subscriptions', {
      params: { range },
    });
    return data;
  },

  async getRevenueAnalytics(range: string): Promise<RevenueAnalyticsResponse> {
    const { data } = await apiClient.get<RevenueAnalyticsResponse>('/platform/analytics/revenue', {
      params: { range },
    });
    return data;
  },

  async getSocialPlatformAnalytics(): Promise<SocialPlatformAnalyticsResponse> {
    const { data } = await apiClient.get<SocialPlatformAnalyticsResponse>('/platform/analytics/social-platforms');
    return data;
  },

  async getPlatformLiveStreamAnalytics(): Promise<LiveStreamAnalyticsResponse> {
    const { data } = await apiClient.get<LiveStreamAnalyticsResponse>('/platform/analytics/livestreams');
    return data;
  },

  async getSummary(workspaceId?: string): Promise<DashboardSummary> {
    const params = workspaceId ? { workspaceId } : {};
    const { data } = await apiClient.get<DashboardSummary>('/dashboard', {
      params,
    });
    return data;
  },

  async getStatistics(workspaceId?: string): Promise<DashboardStatistics> {
    const params = workspaceId ? { workspaceId } : {};
    const { data } = await apiClient.get<DashboardStatistics>(
      '/dashboard/statistics',
      { params },
    );
    return data;
  },

  async getWidgets(workspaceId?: string, widget?: string) {
    const params: any = {};
    if (workspaceId) params.workspaceId = workspaceId;
    if (widget) params.widget = widget;
    
    const { data } = await apiClient.get('/dashboard/widgets', {
      params,
    });
    return data;
  },
};
