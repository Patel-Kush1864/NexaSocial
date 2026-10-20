import { registerAs } from '@nestjs/config';

export const FACEBOOK_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_metadata',
  'pages_manage_posts',
  'publish_video',
];

export default registerAs('oauth', () => ({
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  youtube: {
    clientId: process.env.YOUTUBE_CLIENT_ID,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
  },
  facebook: {
    appId: process.env.FACEBOOK_APP_ID || process.env.FACEBOOK_CLIENT_ID,
    appSecret:
      process.env.FACEBOOK_APP_SECRET || process.env.FACEBOOK_CLIENT_SECRET,
    redirectUri:
      process.env.FACEBOOK_CALLBACK_URL ||
      process.env.FACEBOOK_REDIRECT_URI ||
      'http://localhost:3001/auth/facebook/callback',
    graphVersion: process.env.FACEBOOK_GRAPH_VERSION || 'v23.0',
    scopes: FACEBOOK_SCOPES,
  },
  instagram: {
    clientId: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    redirectUri:
      process.env.INSTAGRAM_REDIRECT_URI ||
      'http://localhost:5000/api/social/callback/instagram',
    scopes: ['instagram_business_basic', 'instagram_business_manage_messages'],
  },
  x: {
    clientId: process.env.X_CLIENT_ID,
    clientSecret: process.env.X_CLIENT_SECRET,
  },
}));
