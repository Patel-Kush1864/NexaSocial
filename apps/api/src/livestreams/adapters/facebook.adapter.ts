/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { PlatformAdapter } from '../interfaces/platform-adapter.interface';

@Injectable()
export class FacebookAdapter implements PlatformAdapter {
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
      const platformStreamId = `fb_video_mock_${Math.random().toString(36).substring(7)}`;
      return {
        platformStreamId,
        streamUrl: 'rtmps://live-api-s.facebook.com:443/rtmp/',
        streamKey: `FB-${platformStreamId}-${Math.random().toString(36).substring(6)}`,
      };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v16.0/me/live_videos?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description: description || 'NexaSocial Live Video',
            status: 'UNPUBLISHED',
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error?.message || 'Failed to create Facebook live video',
        );
      }

      // Facebook stream_url usually contains both streamUrl + streamKey or secure_stream_url
      // We parse the secure_stream_url into url and key
      const secureUrl = data.secure_stream_url || '';
      const parts = secureUrl.split('/rtmp/');
      const streamUrl = parts[0]
        ? `${parts[0]}/rtmp/`
        : 'rtmps://live-api-s.facebook.com:443/rtmp/';
      const streamKey = parts[1] || '';

      return {
        platformStreamId: data.id,
        streamUrl,
        streamKey,
      };
    } catch (err: any) {
      throw new Error(`Facebook createBroadcast failed: ${err.message}`);
    }
  }

  async startBroadcast(
    accessToken: string,
    platformStreamId: string,
  ): Promise<void> {
    // Facebook automatically starts broadcasting once RTMP ingestion starts.
    // However, we can call the API to go live manually if unpublished.
  }

  async stopBroadcast(
    accessToken: string,
    platformStreamId: string,
  ): Promise<void> {
    if (accessToken.startsWith('mock_')) return;

    try {
      const response = await fetch(
        `https://graph.facebook.com/v16.0/${platformStreamId}?end_live_video=true&access_token=${accessToken}`,
        { method: 'POST' },
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error?.message || 'Failed to end Facebook live video',
        );
      }
    } catch (err: any) {
      throw new Error(`Facebook stopBroadcast failed: ${err.message}`);
    }
  }

  async getStatus(
    accessToken: string,
    platformStreamId: string,
  ): Promise<string> {
    if (accessToken.startsWith('mock_')) return 'live';

    try {
      const response = await fetch(
        `https://graph.facebook.com/v16.0/${platformStreamId}?fields=status&access_token=${accessToken}`,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error?.message || 'Failed to fetch Facebook live status',
        );
      }
      return data.status || 'unknown';
    } catch (err: any) {
      throw new Error(`Facebook getStatus failed: ${err.message}`);
    }
  }

  async deleteBroadcast(
    accessToken: string,
    platformStreamId: string,
  ): Promise<void> {
    if (accessToken.startsWith('mock_')) return;

    try {
      const response = await fetch(
        `https://graph.facebook.com/v16.0/${platformStreamId}?access_token=${accessToken}`,
        { method: 'DELETE' },
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error?.message || 'Failed to delete Facebook live video',
        );
      }
    } catch (err: any) {
      throw new Error(`Facebook deleteBroadcast failed: ${err.message}`);
    }
  }
}
