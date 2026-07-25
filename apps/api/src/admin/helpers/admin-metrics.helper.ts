export interface AdminDashboardMetrics {
  totalUsers: number;
  activeSubscriptions: number;
  totalWorkspaces: number;
  connectedAccounts: number;
  liveStreams: number;
  monthlyRevenue: number;
}

export function formatAdminMetrics(
  totalUsers: number,
  activeSubscriptions: number,
  totalWorkspaces: number,
  connectedAccounts: number,
  liveStreams: number,
  estimatedMonthlyRevenue: number,
): AdminDashboardMetrics {
  return {
    totalUsers,
    activeSubscriptions,
    totalWorkspaces,
    connectedAccounts,
    liveStreams,
    monthlyRevenue: estimatedMonthlyRevenue,
  };
}
