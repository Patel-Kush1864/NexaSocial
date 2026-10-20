export interface LiveStreamSummary {
  totalStreams: number;
  scheduled: number;
  liveNow: number;
  completed: number;
  failed: number;
  cancelled: number;
}

export interface LiveStreamAnalyticsItem {
  id: string;
  title: string;
  status: string;
  workspace: {
    id: string;
    name: string;
  };
  platforms: string[];
  startedAt: string | null;
}

export interface LiveStreamAnalyticsResponse {
  summary: LiveStreamSummary;
  liveNow: LiveStreamAnalyticsItem[];
}
