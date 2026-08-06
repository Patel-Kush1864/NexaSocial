/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { PlatformAdapter } from '../interfaces/platform-adapter.interface';
import { safeJson } from '../helpers/safe-json.helper';

@Injectable()
export class LinkedinAdapter implements PlatformAdapter {
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
      const platformStreamId = `li_stream_mock_${Math.random().toString(36).substring(7)}`;
      return {
        platformStreamId,
        streamUrl: 'rtmps://live-ingest.linkedin.com:443/app/',
        streamKey: `li-live-key-${Math.random().toString(36).substring(8)}`,
      };
    }

    try {
      // Create LiveVideoAsset on LinkedIn
      const response = await fetch(
        'https://api.linkedin.com/v2/liveVideoAssets',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'READY',
            title,
            description: description || 'NexaSocial Live Event',
            region: 'US_WEST',
          }),
        },
      );
      const data = await safeJson(response);
      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to create LinkedIn LiveVideoAsset',
        );
      }

      // Extract RTMP details
      const ingestion = data.ingestUrls?.[0] || {};
      return {
        platformStreamId:
          data.id || `li_stream_${Math.random().toString(36).substring(7)}`,
        streamUrl: ingestion.url || 'rtmps://live-ingest.linkedin.com:443/app/',
        streamKey:
          ingestion.key ||
          `li-live-key-${Math.random().toString(36).substring(8)}`,
      };
    } catch (err: any) {
      throw new Error(`LinkedIn createBroadcast failed: ${err.message}`);
    }
  }

  async startBroadcast(
    accessToken: string,
    platformStreamId: string,
  ): Promise<void> {
    if (accessToken.startsWith('mock_')) return;

    try {
      const response = await fetch(
        `https://api.linkedin.com/v2/liveVideoAssets/${platformStreamId}?action=start`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!response.ok) {
        const data = await safeJson(response);
        throw new Error(data.message || 'Failed to start LinkedIn Live event');
      }
    } catch (err: any) {
      throw new Error(`LinkedIn startBroadcast failed: ${err.message}`);
    }
  }

  async stopBroadcast(
    accessToken: string,
    platformStreamId: string,
  ): Promise<void> {
    if (accessToken.startsWith('mock_')) return;

    try {
      const response = await fetch(
        `https://api.linkedin.com/v2/liveVideoAssets/${platformStreamId}?action=stop`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!response.ok) {
        const data = await safeJson(response);
        throw new Error(data.message || 'Failed to stop LinkedIn Live event');
      }
    } catch (err: any) {
      throw new Error(`LinkedIn stopBroadcast failed: ${err.message}`);
    }
  }

  async getStatus(
    accessToken: string,
    platformStreamId: string,
  ): Promise<string> {
    if (accessToken.startsWith('mock_')) return 'live';

    try {
      const response = await fetch(
        `https://api.linkedin.com/v2/liveVideoAssets/${platformStreamId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const data = await safeJson(response);
      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to query LinkedIn LiveVideoAsset status',
        );
      }
      return data.status || 'unknown';
    } catch (err: any) {
      throw new Error(`LinkedIn getStatus failed: ${err.message}`);
    }
  }

  async deleteBroadcast(
    accessToken: string,
    platformStreamId: string,
  ): Promise<void> {
    if (accessToken.startsWith('mock_')) return;

    try {
      const response = await fetch(
        `https://api.linkedin.com/v2/liveVideoAssets/${platformStreamId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!response.ok) {
        const data = await safeJson(response);
        throw new Error(
          data.message || 'Failed to delete LinkedIn LiveVideoAsset',
        );
      }
    } catch (err: any) {
      throw new Error(`LinkedIn deleteBroadcast failed: ${err.message}`);
    }
  }
}
