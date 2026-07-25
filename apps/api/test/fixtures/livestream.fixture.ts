import * as crypto from 'crypto';

export const createMockStream = (overrides: Record<string, any> = {}) => ({
  id: crypto.randomUUID(),
  workspaceId: crypto.randomUUID(),
  title: 'Enterprise Broadcast Event',
  description: 'Live testing multi-destination broadcasting',
  scheduledStartTime: new Date(Date.now() + 3600000),
  status: 'SCHEDULED',
  platforms: ['YOUTUBE', 'FACEBOOK', 'TWITCH'],
  rtmpUrl: 'rtmp://live.stream.server/app',
  streamKey: 'live_key_99887766',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
