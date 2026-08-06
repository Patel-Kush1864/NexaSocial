/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { PlatformAdapter } from '../interfaces/platform-adapter.interface';
import { safeJson } from '../helpers/safe-json.helper';

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
      const broadcastData = await safeJson(broadcastRes);
      if (!broadcastRes.ok) {
        const errMsg = String(broadcastData.error?.message || '');
        if (
          errMsg.includes('liveStreamingNotEnabled') ||
          errMsg.toLowerCase().includes('not enabled for live streaming') ||
          broadcastRes.status === 403
        ) {
          throw new Error(
            'Live streaming is not enabled on this YouTube channel. Please visit https://studio.youtube.com, click "Go Live" to complete phone verification, and wait 24h for YouTube activation.',
          );
        }
        throw new Error(errMsg || 'Failed to create YouTube broadcast');
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
      const streamData = await safeJson(streamRes);
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
        const bindData = await safeJson(bindRes);
        throw new Error(
          bindData.error?.message ||
            'Failed to bind YouTube stream to broadcast',
        );
      }

      return {
        platformStreamId: broadcastData.id,
        streamUrl:
          streamData.cdn?.ingestionInfo?.ingestionAddress ||
          'rtmp://a.rtmp.youtube.com/live2',
        streamKey:
          streamData.cdn?.ingestionInfo?.streamName ||
          `x-youtube-key-${Math.random().toString(36).substring(5)}`,
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
        const data = await safeJson(response);
        const errMsg = String(data.error?.message || '');
        if (
          errMsg.toLowerCase().includes('redundant') ||
          errMsg.toLowerCase().includes('offline') ||
          errMsg.toLowerCase().includes('inactive')
        ) {
          // Stream broadcast created. Waiting for video ingestion from streaming software (OBS).
          return;
        }
        throw new Error(
          errMsg || 'Failed to transition YouTube broadcast to live status',
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const lowerMsg = msg.toLowerCase();
      if (
        lowerMsg.includes('offline') ||
        lowerMsg.includes('inactive') ||
        lowerMsg.includes('redundant')
      ) {
        return;
      }
      throw new Error(`YouTube startBroadcast failed: ${msg}`);
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
        const data = await safeJson(response);
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
      const data = await safeJson(response);
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
        const data = await safeJson(response);
        throw new Error(
          data.error?.message || 'Failed to delete YouTube broadcast',
        );
      }
    } catch (err: any) {
      throw new Error(`YouTube deleteBroadcast failed: ${err.message}`);
    }
  }
}
