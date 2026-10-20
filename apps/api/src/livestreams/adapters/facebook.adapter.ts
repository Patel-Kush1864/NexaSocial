/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { PlatformAdapter } from '../interfaces/platform-adapter.interface';
import { safeJson } from '../helpers/safe-json.helper';

export interface FacebookGraphError extends Error {
  code?: number | string;
  errorSubcode?: number | string;
  fbTraceId?: string;
}

@Injectable()
export class FacebookAdapter implements PlatformAdapter {
  async createBroadcast(
    accessToken: string,
    title: string,
    description?: string,
    pageId?: string,
  ): Promise<{
    platformStreamId: string;
    streamUrl: string;
    streamKey: string;
    secureStreamUrl?: string;
  }> {
    if (accessToken.startsWith('mock_')) {
      console.log(
        `\x1b[33m[FB GRAPH API] createBroadcast skipped: Mock token detected\x1b[0m`,
      );
      throw new Error(
        'Facebook Live configuration required. Please configure your RTMPS Server URL and Stream Key manually.',
      );
    }

    const targetPath = pageId || 'me';
    const requestUrl = `https://graph.facebook.com/v23.0/${targetPath}/live_videos`;
    console.log(
      `\x1b[1;34m[FB GRAPH API >> REQUEST]\x1b[0m POST ${requestUrl}\n` +
      `  • Target Page / Account: ${targetPath}\n` +
      `  • Title:                 "${title || 'NexaSocial Live Video'}"\n` +
      `  • Description:           "${(description || '').slice(0, 50)}..."\n` +
      `  • Initial Status:        UNPUBLISHED`,
    );

    const startTime = Date.now();
    try {
      const response = await fetch(
        `${requestUrl}?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title || 'NexaSocial Live Video',
            description: description || 'NexaSocial Live Video',
            status: 'UNPUBLISHED',
          }),
        },
      );
      const latency = Date.now() - startTime;
      const data = await safeJson(response);

      if (!response.ok || !data.id) {
        console.error(
          `\x1b[1;31m[FB GRAPH API << ERROR]\x1b[0m HTTP ${response.status} (${latency}ms)\n` +
          `  • Error Message: ${data.error?.message || 'Unknown Facebook API error'}\n` +
          `  • Error Code:    ${data.error?.code}\n` +
          `  • Subcode:       ${data.error?.error_subcode}\n` +
          `  • Trace ID:      ${data.error?.fbtrace_id}\n`,
        );
        const error = new Error(
          data.error?.message || 'Failed to create Facebook live video',
        ) as FacebookGraphError;
        error.code = data.error?.code;
        error.errorSubcode = data.error?.error_subcode;
        error.fbTraceId = data.error?.fbtrace_id;
        throw error;
      }

      // Facebook secure_stream_url usually contains both streamUrl + streamKey
      const secureUrl = data.secure_stream_url || data.stream_url || '';
      const parts = secureUrl.split('/rtmp/');
      const streamUrl = parts[0]
        ? `${parts[0]}/rtmp/`
        : 'rtmps://live-api-s.facebook.com:443/rtmp/';
      const streamKey =
        parts[1] || `FB-key-${Math.random().toString(36).substring(6)}`;

      console.log(
        `\x1b[1;32m[FB GRAPH API << SUCCESS]\x1b[0m HTTP ${response.status} Created (${latency}ms)\n` +
        `  ✔ Live Video ID:         \x1b[1;32m${data.id}\x1b[0m\n` +
        `  ✔ RTMPS Endpoint:        ${streamUrl}\n` +
        `  ✔ Stream Key:            ${streamKey.slice(0, 6)}••••••••\n` +
        `  ✔ Live Producer URL:     https://www.facebook.com/live/producer/${data.id}\n`,
      );

      return {
        platformStreamId: data.id,
        streamUrl,
        streamKey,
        secureStreamUrl: secureUrl,
      };
    } catch (err: any) {
      if (!err.code) {
        console.error(
          `\x1b[1;31m[FB GRAPH API EXCEPTION]\x1b[0m createBroadcast failed: ${err.message}`,
        );
      }
      const error = new Error(
        `Facebook createBroadcast failed: ${err.message}`,
      ) as FacebookGraphError;
      error.code = err.code;
      error.errorSubcode = err.errorSubcode;
      throw error;
    }
  }

  async updateMetadata(
    accessToken: string,
    platformStreamId: string,
    title: string,
    description?: string,
  ): Promise<{ success: boolean; id: string }> {
    if (accessToken.startsWith('mock_') || !platformStreamId) {
      console.log(
        `\x1b[33m[FB GRAPH API] updateMetadata skipped (mock or missing ID)\x1b[0m`,
      );
      return { success: true, id: platformStreamId };
    }

    const requestUrl = `https://graph.facebook.com/v23.0/${platformStreamId}`;
    console.log(
      `\x1b[1;34m[FB GRAPH API >> REQUEST]\x1b[0m POST ${requestUrl} (Update Details)\n` +
      `  • Live Video ID: ${platformStreamId}\n` +
      `  • New Title:     "${title}"\n` +
      `  • Description:   "${(description || '').slice(0, 50)}..."`,
    );

    const startTime = Date.now();
    try {
      const response = await fetch(
        `${requestUrl}?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title || '',
            description: description || '',
          }),
        },
      );
      const latency = Date.now() - startTime;
      const data = await safeJson(response);

      if (!response.ok || data.error) {
        console.error(
          `\x1b[1;31m[FB GRAPH API << ERROR]\x1b[0m HTTP ${response.status} (${latency}ms)\n` +
          `  • Error:   ${data.error?.message || 'Failed to update post details'}\n` +
          `  • Code:    ${data.error?.code} (subcode: ${data.error?.error_subcode})\n`,
        );
        const error = new Error(
          data.error?.message || 'Failed to update Facebook post details',
        ) as FacebookGraphError;
        error.code = data.error?.code;
        error.errorSubcode = data.error?.error_subcode;
        throw error;
      }

      console.log(
        `\x1b[1;32m[FB GRAPH API << SUCCESS]\x1b[0m HTTP ${response.status} Updated (${latency}ms) for Video ID: ${platformStreamId}\n`,
      );
      return { success: true, id: platformStreamId };
    } catch (err: any) {
      if (!err.code) {
        console.error(
          `\x1b[1;31m[FB GRAPH API EXCEPTION]\x1b[0m updateMetadata failed: ${err.message}`,
        );
      }
      const error = new Error(
        `Facebook updateMetadata failed: ${err.message}`,
      ) as FacebookGraphError;
      error.code = err.code;
      error.errorSubcode = err.errorSubcode;
      throw error;
    }
  }

  async verifyStreamIngest(
    accessToken: string,
    platformStreamId: string,
  ): Promise<{
    isIngesting: boolean;
    status: string;
    dashPreviewUrl?: string;
    secureStreamUrl?: string;
    streamUrl?: string;
  }> {
    if (accessToken.startsWith('mock_') || !platformStreamId) {
      return { isIngesting: true, status: 'UNPUBLISHED' };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v23.0/${platformStreamId}?fields=status,dash_preview_url,secure_stream_url,stream_url,ingest_streams&access_token=${accessToken}`,
      );
      if (!response.ok) {
        const data = await safeJson(response);
        console.warn(
          `\x1b[33m[FB GRAPH API ingest check notice]\x1b[0m HTTP ${response.status}: ${data.error?.message || 'Failed to inspect stream status'}`,
        );
        const error = new Error(
          data.error?.message || 'Failed to check Facebook stream ingest',
        ) as FacebookGraphError;
        error.code = data.error?.code;
        throw error;
      }
      const data = await safeJson(response);
      const hasPreview = Boolean(data.dash_preview_url);
      const isLive = data.status === 'LIVE' || data.status === 'LIVE_STOPPED';

      console.log(
        `\x1b[36m[FB GRAPH API INGEST STATUS]\x1b[0m Video ID: ${platformStreamId}\n` +
        `  • Status:        ${data.status || 'UNPUBLISHED'}\n` +
        `  • Has Preview:   ${hasPreview ? '\x1b[32mYES\x1b[0m' : 'NO'}\n` +
        `  • Ingest Active: ${hasPreview || isLive ? '\x1b[32mCONNECTED\x1b[0m' : 'WAITING'}`,
      );

      return {
        isIngesting: hasPreview || isLive,
        status: data.status || 'UNPUBLISHED',
        dashPreviewUrl: data.dash_preview_url,
        secureStreamUrl: data.secure_stream_url || data.stream_url,
        streamUrl: data.stream_url,
      };
    } catch (err: any) {
      const error = new Error(
        `Facebook verifyStreamIngest failed: ${err.message}`,
      ) as FacebookGraphError;
      error.code = err.code;
      throw error;
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

    console.log(
      `\x1b[36m[FB GRAPH API] Polling stream ingest active status (max ${maxWaitMs / 1000}s)...\x1b[0m`,
    );
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      try {
        const response = await fetch(
          `https://graph.facebook.com/v23.0/${streamId}?fields=status,dash_preview_url&access_token=${accessToken}`,
        );
        if (response.ok) {
          const data = await safeJson(response);
          if (
            data.dash_preview_url ||
            data.status === 'LIVE' ||
            data.status === 'LIVE_STOPPED'
          ) {
            console.log(
              `\x1b[32m[FB GRAPH API] Stream active confirmed on Facebook ingest servers!\x1b[0m`,
            );
            return true;
          }
        }
      } catch {
        // Ignore polling errors and retry
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    console.warn(
      `\x1b[33m[FB GRAPH API] Stream polling timed out, continuing with publish...\x1b[0m`,
    );
    return false;
  }

  async startBroadcast(
    accessToken: string,
    platformStreamId: string,
  ): Promise<void> {
    if (accessToken.startsWith('mock_')) return;

    const requestUrl = `https://graph.facebook.com/v23.0/${platformStreamId}`;
    console.log(
      `\x1b[1;32m[FB GRAPH API >> REQUEST]\x1b[0m POST ${requestUrl} (Transition to LIVE_NOW)\n` +
      `  • Target Video ID: \x1b[1;32m${platformStreamId}\x1b[0m\n` +
      `  • Desired Status:  LIVE_NOW`,
    );

    const startTime = Date.now();
    try {
      // Complete the supported Facebook publishing operation by transitioning UNPUBLISHED to LIVE_NOW
      const response = await fetch(
        `${requestUrl}?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'LIVE_NOW',
          }),
        },
      );
      const latency = Date.now() - startTime;
      const data = await safeJson(response);

      if (!response.ok || data.error) {
        console.error(
          `\x1b[1;31m[FB GRAPH API << ERROR PUBLISHING]\x1b[0m HTTP ${response.status} (${latency}ms)\n` +
          `  • Error:   ${data.error?.message || 'Failed to publish/start Facebook live video'}\n` +
          `  • Code:    ${data.error?.code}\n` +
          `  • Subcode: ${data.error?.error_subcode}\n`,
        );
        const error = new Error(
          data.error?.message || 'Failed to publish/start Facebook live video',
        ) as FacebookGraphError;
        error.code = data.error?.code;
        error.errorSubcode = data.error?.error_subcode;
        throw error;
      }

      console.log(
        `\x1b[1;32m[FB GRAPH API << SUCCESS]\x1b[0m HTTP ${response.status} Broadcast published LIVE! (${latency}ms)\n` +
        `  ✔ Video ID ${platformStreamId} is now LIVE on Facebook!\n`,
      );
    } catch (err: any) {
      if (!err.code) {
        console.error(
          `\x1b[1;31m[FB GRAPH API EXCEPTION]\x1b[0m startBroadcast failed: ${err.message}`,
        );
      }
      const error = new Error(
        `Facebook startBroadcast failed: ${err.message}`,
      ) as FacebookGraphError;
      error.code = err.code;
      error.errorSubcode = err.errorSubcode;
      throw error;
    }
  }

  async stopBroadcast(
    accessToken: string,
    platformStreamId: string,
  ): Promise<void> {
    if (accessToken.startsWith('mock_')) return;

    try {
      const response = await fetch(
        `https://graph.facebook.com/v23.0/${platformStreamId}?end_live_video=true&access_token=${accessToken}`,
        { method: 'POST' },
      );
      if (!response.ok) {
        const data = await safeJson(response);
        const error = new Error(
          data.error?.message || 'Failed to end Facebook live video',
        ) as FacebookGraphError;
        error.code = data.error?.code;
        throw error;
      }
    } catch (err: any) {
      const error = new Error(
        `Facebook stopBroadcast failed: ${err.message}`,
      ) as FacebookGraphError;
      error.code = err.code;
      throw error;
    }
  }

  async getStatus(
    accessToken: string,
    platformStreamId: string,
  ): Promise<string> {
    if (accessToken.startsWith('mock_')) return 'live';

    try {
      const response = await fetch(
        `https://graph.facebook.com/v23.0/${platformStreamId}?fields=status&access_token=${accessToken}`,
      );
      const data = await safeJson(response);
      if (!response.ok || data.error) {
        const error = new Error(
          data.error?.message || 'Failed to fetch Facebook live status',
        ) as FacebookGraphError;
        error.code = data.error?.code;
        throw error;
      }
      return data.status || 'unknown';
    } catch (err: any) {
      const error = new Error(
        `Facebook getStatus failed: ${err.message}`,
      ) as FacebookGraphError;
      error.code = err.code;
      throw error;
    }
  }

  async deleteBroadcast(
    accessToken: string,
    platformStreamId: string,
  ): Promise<void> {
    if (accessToken.startsWith('mock_')) return;

    try {
      const response = await fetch(
        `https://graph.facebook.com/v23.0/${platformStreamId}?access_token=${accessToken}`,
        { method: 'DELETE' },
      );
      if (!response.ok) {
        const data = await safeJson(response);
        const error = new Error(
          data.error?.message || 'Failed to delete Facebook live video',
        ) as FacebookGraphError;
        error.code = data.error?.code;
        throw error;
      }
    } catch (err: any) {
      const error = new Error(
        `Facebook deleteBroadcast failed: ${err.message}`,
      ) as FacebookGraphError;
      error.code = err.code;
      throw error;
    }
  }

  async getViewerUrl(
    accessToken: string,
    platformStreamId: string,
  ): Promise<string | null> {
    if (accessToken.startsWith('mock_')) return null;

    try {
      const response = await fetch(
        `https://graph.facebook.com/v23.0/${platformStreamId}?fields=permalink_url&access_token=${accessToken}`,
      );
      if (response.ok) {
        const data = await safeJson(response);
        if (data.permalink_url) {
          if (data.permalink_url.startsWith('http')) {
            return data.permalink_url;
          }
          return `https://www.facebook.com${data.permalink_url}`;
        }
      }
    } catch {
      // Ignore errors fetching permalink
    }

    // Fallback to the standard Watch URL for live videos
    return `https://www.facebook.com/watch/live/?v=${platformStreamId}`;
  }
}
