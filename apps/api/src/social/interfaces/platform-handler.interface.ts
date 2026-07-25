export interface PlatformProfile {
  platformUserId: string;
  name: string;
  avatar?: string;
  metadata?: Record<string, any>;
}

export interface PlatformOAuthResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number; // in seconds
  scope?: string;
  tokenType?: string;
}

export interface PlatformHandler {
  getAuthUrl(state: string): string;
  exchangeCode(code: string): Promise<PlatformOAuthResult>;
  refreshTokens(refreshToken: string): Promise<PlatformOAuthResult>;
  fetchProfile(accessToken: string): Promise<PlatformProfile>;
}
