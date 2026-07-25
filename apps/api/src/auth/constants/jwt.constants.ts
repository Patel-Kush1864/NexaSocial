export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'nexa_social_secret_key_123',
  expiresIn: 900, // 15 minutes (in seconds)
  refreshSecret:
    process.env.JWT_REFRESH_SECRET || 'nexa_social_refresh_secret_key_456',
  refreshExpiresIn: 604800, // 7 days (in seconds)
};
