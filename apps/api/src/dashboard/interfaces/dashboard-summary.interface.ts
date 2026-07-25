export interface DashboardSummaryResponse {
  workspace: {
    id: string;
    name: string;
    slug?: string;
  };
  subscription: string;
  connectedAccounts: number;
  scheduledStreams: number;
  liveStreams: number;
  teamMembers: number;
  notifications: number;
}

export interface DashboardStatisticsResponse {
  totalStreams: number;
  activeStreams: number;
  completedStreams: number;
  failedStreams: number;
  connectedAccounts: number;
  teamMembers: number;
}

export interface DashboardWidgetData {
  widgetName: string;
  title: string;
  data: any;
}
