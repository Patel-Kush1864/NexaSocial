/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { PlatformAdapter } from '../interfaces/platform-adapter.interface';

@Injectable()
export class YoutubeAdapter implements PlatformAdapter {
  async createBroadcast(
    accessToken: string,
    title: string,
    description?: string,
  ): Promise<{
    platformStreamId: string;
    streamUrl: string;
    streamKey: string;
  }> {
    if (accessToken.startsWith('mock_')) {
      const platformStreamId = `yt_broadcast_mock_${Math.random().toString(36).substring(7)}`;
      return {
        platformStreamId,
        streamUrl: 'rtmp://a.rtmp.youtube.com/live2',
        streamKey: `x-youtube-key-${Math.random().toString(36).substring(5)}-${Math.random().toString(36).substring(5)}`,
      };
    }

    try {
      // 1. Create Live Broadcast
      const broadcastRes = await fetch(
        'https://www.googleapis.com/youtube/v3/liveBroadcasts?part=id,snippet,status',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            snippet: {
              title,
              description: description || 'NexaSocial Live Stream',
              scheduledStartTime: new Date(Date.now() + 5000).toISOString(),
            },
            status: {
              privacyStatus: 'public',
              selfDeclaredCreativeCommons: false,
            },
          }),
        },
      );
      const broadcastData = await broadcastRes.json();
      if (!broadcastRes.ok) {
        throw new Error(
          broadcastData.error?.message || 'Failed to create YouTube broadcast',
        );
      }

      // 2. Create Live Stream (RTMP details)
      const streamRes = await fetch(
        'https://www.googleapis.com/youtube/v3/liveStreams?part=id,cdn',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            snippet: { title: `${title} Stream` },
            cdn: {
              frameRate: '30fps',
              resolution: '1080p',
              ingestionType: 'rtmp',
            },
          }),
        },
      );
      const streamData = await streamRes.json();
      if (!streamRes.ok) {
        throw new Error(
          streamData.error?.message || 'Failed to create YouTube stream config',
        );
      }

      // 3. Bind Broadcast and Stream
      const bindRes = await fetch(
        `https://www.googleapis.com/youtube/v3/liveBroadcasts/bind?id=${broadcastData.id}&part=id&streamId=${streamData.id}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!bindRes.ok) {
        const bindData = await bindRes.json();
        throw new Error(
          bindData.error?.message ||
            'Failed to bind YouTube stream to broadcast',
        );
      }

      return {
        platformStreamId: broadcastData.id,
        streamUrl: streamData.cdn.ingestionInfo.ingestionAddress,
        streamKey: streamData.cdn.ingestionInfo.streamName,
      };
    } catch (err: any) {
      throw new Error(`YouTube createBroadcast failed: ${err.message}`);
    }
  }

  async startBroadcast(
    accessToken: string,
    platformStreamId: string,
  ): Promise<void> {
    if (accessToken.startsWith('mock_')) return;

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/liveBroadcasts/transition?id=${platformStreamId}&broadcastStatus=live&part=id,status`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error?.message ||
            'Failed to transition YouTube broadcast to live status',
        );
      }
    } catch (err: any) {
      throw new Error(`YouTube startBroadcast failed: ${err.message}`);
    }
  }

  async stopBroadcast(
    accessToken: string,
    platformStreamId: string,
  ): Promise<void> {
    if (accessToken.startsWith('mock_')) return;

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/liveBroadcasts/transition?id=${platformStreamId}&broadcastStatus=complete&part=id,status`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error?.message || 'Failed to complete YouTube broadcast',
        );
      }
    } catch (err: any) {
      throw new Error(`YouTube stopBroadcast failed: ${err.message}`);
    }
  }

  async getStatus(
    accessToken: string,
    platformStreamId: string,
  ): Promise<string> {
    if (accessToken.startsWith('mock_')) return 'live';

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/liveBroadcasts?id=${platformStreamId}&part=status`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error?.message || 'Failed to fetch YouTube broadcast status',
        );
      }
      return data.items?.[0]?.status?.lifeCycleStatus || 'unknown';
    } catch (err: any) {
      throw new Error(`YouTube getStatus failed: ${err.message}`);
    }
  }

  async deleteBroadcast(
    accessToken: string,
    platformStreamId: string,
  ): Promise<void> {
    if (accessToken.startsWith('mock_')) return;

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/liveBroadcasts?id=${platformStreamId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error?.message || 'Failed to delete YouTube broadcast',
        );
      }
    } catch (err: any) {
      throw new Error(`YouTube deleteBroadcast failed: ${err.message}`);
    }
  }
}
