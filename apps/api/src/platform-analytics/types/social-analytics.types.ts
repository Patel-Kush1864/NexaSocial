export type SocialPlatform =
  'YOUTUBE' | 'FACEBOOK' | 'INSTAGRAM' | 'X';

export type PlatformStatus =
  'OPERATIONAL' | 'DEGRADED' | 'MAJOR_ISSUES' | 'UNAVAILABLE' | 'UNKNOWN';

export interface SocialPlatformAnalytics {
  platform: SocialPlatform;
  displayName: string;
  connectedAccounts: number;
  activeConnections: number;
  connectionErrors: number;
  lastSyncAt: string | null;
  status: PlatformStatus;
}

export interface SocialPlatformUsagePoint {
  platform: SocialPlatform;
  connectedAccounts: number;
}

export interface SocialPlatformAnalyticsResponse {
  platforms: SocialPlatformAnalytics[];
  usage: SocialPlatformUsagePoint[];
}
