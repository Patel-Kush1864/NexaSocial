import * as crypto from 'crypto';

export const SUPPORTED_PLATFORMS = [
  'YOUTUBE',
  'FACEBOOK',
  'INSTAGRAM',
  'LINKEDIN',
  'X',
  'TWITCH',
  'TIKTOK',
] as const;

export const createMockSocialAccount = (
  platform = 'YOUTUBE',
  overrides: Record<string, any> = {},
) => ({
  id: crypto.randomUUID(),
  workspaceId: crypto.randomUUID(),
  platform,
  accountId: 'acc_12345678',
  accountName: 'EnterpriseAccount',
  accessToken: 'access_token_mock',
  refreshToken: 'refresh_token_mock',
  expiresAt: new Date(Date.now() + 86400000),
  isConnected: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
