/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { PlatformAdapter } from '../interfaces/platform-adapter.interface';

@Injectable()
export class TwitchAdapter implements PlatformAdapter {
  private readonly clientId = process.env.TWITCH_CLIENT_ID;

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
      const platformStreamId = `twitch_stream_mock_${Math.random().toString(36).substring(7)}`;
      return {
        platformStreamId,
        streamUrl: 'rtmp://live.twitch.tv/app',
        streamKey: `live_twitch_${Math.random().toString(36).substring(8)}`,
      };
    }

    try {
      // 1. Fetch User Profile to get Broadcaster ID
      const userRes = await fetch('https://api.twitch.tv/helix/users', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Client-Id': this.clientId || '',
        },
      });
      const userData = await userRes.json();
      if (!userRes.ok) {
        throw new Error(
          userData.message || 'Failed to fetch Twitch user profile',
        );
      }
      const broadcasterId = userData.data?.[0]?.id;
      if (!broadcasterId) {
        throw new Error('No Twitch broadcaster ID found');
      }

      // 2. Fetch Stream Key
      const keyRes = await fetch(
        `https://api.twitch.tv/helix/streams/key?broadcaster_id=${broadcasterId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': this.clientId || '',
          },
        },
      );
      const keyData = await keyRes.json();
      if (!keyRes.ok) {
        throw new Error(
          keyData.message || 'Failed to retrieve Twitch stream key',
        );
      }
      const streamKey = keyData.data?.[0]?.stream_key;
      if (!streamKey) {
        throw new Error('Twitch stream key was empty');
      }

      // 3. Update Channel Info (Title)
      await fetch(
        `https://api.twitch.tv/helix/channels?broadcaster_id=${broadcasterId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': this.clientId || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
          }),
        },
      );

      return {
        platformStreamId: broadcasterId,
        streamUrl: 'rtmp://live.twitch.tv/app',
        streamKey,
      };
    } catch (err: any) {
      throw new Error(`Twitch createBroadcast failed: ${err.message}`);
    }
  }

  async startBroadcast(
    accessToken: string,
    platformStreamId: string,
  ): Promise<void> {
    // Twitch goes live automatically when ingestion starts.
  }

  async stopBroadcast(
    accessToken: string,
    platformStreamId: string,
  ): Promise<void> {
    // Twitch ends automatically when ingestion stops.
  }

  async getStatus(
    accessToken: string,
    platformStreamId: string,
  ): Promise<string> {
    if (accessToken.startsWith('mock_')) return 'live';

    try {
      const response = await fetch(
        `https://api.twitch.tv/helix/streams?user_id=${platformStreamId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': this.clientId || '',
          },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to query Twitch stream status');
      }
      const stream = data.data?.[0];
      return stream ? 'live' : 'offline';
    } catch (err: any) {
      throw new Error(`Twitch getStatus failed: ${err.message}`);
    }
  }

  async deleteBroadcast(
    accessToken: string,
    platformStreamId: string,
  ): Promise<void> {
    // No action needed for Twitch
  }
}
