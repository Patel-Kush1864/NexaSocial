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
