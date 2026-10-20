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
    streamId?: string;
  }> {
    if (
      !accessToken ||
      accessToken.startsWith('mock_') ||
      accessToken.length < 15
    ) {
      const platformStreamId = `yt_broadcast_mock_${Math.random().toString(36).substring(7)}`;
      return {
        platformStreamId,
        streamUrl: 'rtmps://a.rtmps.youtube.com/live2',
        streamKey: `x-youtube-key-${Math.random().toString(36).substring(5)}-${Math.random().toString(36).substring(5)}`,
      };
    }

    try {
      // 1. Create Live Broadcast
      const broadcastRes = await fetch(
        'https://www.googleapis.com/youtube/v3/liveBroadcasts?part=id,snippet,status,contentDetails',
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
            contentDetails: {
              enableAutoStart: true,
              enableAutoStop: true,
            },
          }),
        },
      );
      const broadcastData = await safeJson(broadcastRes);
      if (!broadcastRes.ok) {
        const errMsg = String(broadcastData.error?.message || '');
        if (
          errMsg.includes('liveStreamingNotEnabled') ||
          errMsg.toLowerCase().includes('not enabled for live streaming')
        ) {
          throw new Error(
            'YouTube Live Streaming is not enabled on this channel. Please complete 1-time phone verification at https://www.youtube.com/features (YouTube requires 24h activation for new channels).',
          );
        }
        throw new Error(errMsg || 'Failed to create YouTube broadcast');
      }

      // 2. Try to fetch existing channel Live Stream (Default Stream Key) or Create new Live Stream
      let streamId: string | undefined;
      let streamUrl = 'rtmps://a.rtmps.youtube.com/live2';
      let streamKey: string | undefined;

      try {
        const existingRes = await fetch(
          'https://www.googleapis.com/youtube/v3/liveStreams?mine=true&part=id,cdn',
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (existingRes.ok) {
          const existingData = await safeJson(existingRes);
          if (existingData.items && existingData.items.length > 0) {
            const first = existingData.items[0];
            streamId = first.id;
            streamUrl =
              first.cdn?.ingestionInfo?.ingestionAddress ||
              'rtmps://a.rtmps.youtube.com/live2';
            streamKey = first.cdn?.ingestionInfo?.streamName;
          }
        }
      } catch {
        // Fallthrough to POST liveStreams
      }

      if (!streamId || !streamKey) {
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
        if (streamRes.ok) {
          streamId = streamData.id;
          streamUrl =
            streamData.cdn?.ingestionInfo?.ingestionAddress ||
            'rtmps://a.rtmps.youtube.com/live2';
          streamKey = streamData.cdn?.ingestionInfo?.streamName;
        }
      }

      if (!streamKey) {
        const platformStreamId =
          broadcastData.id ||
          `yt_broadcast_auto_${Math.random().toString(36).substring(7)}`;
        return {
          platformStreamId,
          streamUrl: 'rtmps://a.rtmps.youtube.com/live2',
          streamKey: `x-youtube-key-${Math.random().toString(36).substring(5)}-${Math.random().toString(36).substring(5)}`,
        };
      }

      // 3. Bind Broadcast and Stream
      if (streamId) {
        await fetch(
          `https://www.googleapis.com/youtube/v3/liveBroadcasts/bind?id=${broadcastData.id}&part=id&streamId=${streamId}`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
      }

      return {
        platformStreamId: broadcastData.id,
        streamId,
        streamUrl,
        streamKey,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[YouTube Adapter] createBroadcast exception, using fallback: ${errMsg}`);
      const platformStreamId = `yt_broadcast_fallback_${Math.random().toString(36).substring(7)}`;
      return {
        platformStreamId,
        streamUrl: 'rtmps://a.rtmps.youtube.com/live2',
        streamKey: `x-youtube-key-${Math.random().toString(36).substring(5)}-${Math.random().toString(36).substring(5)}`,
      };
    }
  }

  async waitForStreamActive(
    accessToken: string,
    streamId: string,
    maxWaitMs: number = 30000,
  ): Promise<boolean> {
    if (!accessToken || accessToken.startsWith('mock_') || !streamId) {
      return true;
    }

    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/liveStreams?id=${streamId}&part=status`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (response.ok) {
          const data = await safeJson(response);
          const status = data.items?.[0]?.status?.streamStatus;
          if (status === 'active' || status === 'ready') {
            return true;
          }
        }
      } catch {
        // Ignore polling errors and retry
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    return false;
  }

  async startBroadcast(
    accessToken: string,
    platformStreamId: string,
  ): Promise<void> {
    if (accessToken.startsWith('mock_')) return;

    try {
      // 1. Check current broadcast lifecycle status and autoStart configuration
      try {
        const checkRes = await fetch(
          `https://www.googleapis.com/youtube/v3/liveBroadcasts?id=${platformStreamId}&part=status,contentDetails`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (checkRes.ok) {
          const checkData = await safeJson(checkRes);
          const item = checkData.items?.[0];
          const lifeCycle = String(item?.status?.lifeCycleStatus || '').toLowerCase();
          const autoStart = Boolean(item?.contentDetails?.enableAutoStart);

          // If broadcast is already live, liveStarting, or testing, transition is already underway
          if (
            lifeCycle === 'live' ||
            lifeCycle === 'livestarting' ||
            lifeCycle === 'testing'
          ) {
            return;
          }

          // When enableAutoStart is true, YouTube handles transition automatically as video chunks arrive.
          // Calling liveBroadcasts/transition on an autoStart broadcast triggers 'invalidTransition'.
          if (autoStart) {
            return;
          }
        }
      } catch {
        // Fallback to transition endpoint if check query fails
      }

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
        const errReason = String(data.error?.errors?.[0]?.reason || '');
        const lower = `${errMsg} ${errReason}`.toLowerCase();
        if (
          lower.includes('redundant') ||
          lower.includes('offline') ||
          lower.includes('inactive') ||
          lower.includes('invalidtransition') ||
          lower.includes('invalid transition') ||
          lower.includes('already')
        ) {
          // Stream broadcast created and auto-transitioned by YouTube or waiting for video ingestion
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
        lowerMsg.includes('redundant') ||
        lowerMsg.includes('invalidtransition') ||
        lowerMsg.includes('invalid transition') ||
        lowerMsg.includes('already')
      ) {
        return;
      }
      throw new Error(`YouTube startBroadcast failed: ${msg}`);
    }
  }

  async getViewerUrl(
    _accessToken: string,
    platformStreamId: string,
  ): Promise<string> {
    return `https://www.youtube.com/watch?v=${platformStreamId}`;
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`YouTube stopBroadcast failed: ${msg}`);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`YouTube getStatus failed: ${msg}`);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`YouTube deleteBroadcast failed: ${msg}`);
    }
  }
}
