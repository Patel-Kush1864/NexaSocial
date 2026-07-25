export const createMockOAuthProvider = () => ({
  getAuthUrl: jest
    .fn()
    .mockReturnValue('https://oauth-provider.com/auth?state=valid-state'),
  exchangeCodeForToken: jest.fn().mockResolvedValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
  }),
  refreshAccessToken: jest.fn().mockResolvedValue({
    accessToken: 'new-mock-access-token',
    expiresIn: 3600,
  }),
  getUserProfile: jest.fn().mockResolvedValue({
    id: 'oauth-user-id-99',
    name: 'OAuth User',
    email: 'oauthuser@example.com',
  }),
  revokePermissions: jest.fn().mockResolvedValue(true),
});
