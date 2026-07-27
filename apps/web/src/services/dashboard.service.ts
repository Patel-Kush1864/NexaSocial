// ═══════════════════════════════════════════
// NexaSocial — Dashboard API Service
// ═══════════════════════════════════════════

import apiClient from '@/lib/api-client';
import type { DashboardSummary, DashboardStatistics } from '@/types';

export const dashboardService = {
  async getSummary(workspaceId: string): Promise<DashboardSummary> {
    const { data } = await apiClient.get<DashboardSummary>('/dashboard', {
      params: { workspaceId },
    });
    return data;
  },

  async getStatistics(workspaceId: string): Promise<DashboardStatistics> {
    const { data } = await apiClient.get<DashboardStatistics>(
      '/dashboard/statistics',
      { params: { workspaceId } },
    );
    return data;
  },

  async getWidgets(workspaceId: string, widget?: string) {
    const { data } = await apiClient.get('/dashboard/widgets', {
      params: { workspaceId, widget },
    });
    return data;
  },
};
