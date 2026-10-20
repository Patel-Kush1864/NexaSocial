/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/require-await */
import { Injectable, BadRequestException } from '@nestjs/common';
import { PlatformAdapter } from '../interfaces/platform-adapter.interface';

export type InstagramStreamingMode = 'AUTOMATED' | 'LIVE_PRODUCER' | 'UNSUPPORTED';

export interface InstagramBroadcastOptions {
  customStreamUrl?: string;
  customStreamKey?: string;
  accountUsername?: string;
  accountType?: string;
  isLiveEligible?: boolean;
}

@Injectable()
export class InstagramAdapter implements PlatformAdapter {
  private static readonly DEFAULT_INGEST_URL =
    'rtmps://live-upload.instagram.com:443/rtmp/';

  /**
   * Evaluates supported streaming mode.
   * Public Meta Instagram Graph API does not currently offer an automated broadcast creation endpoint.
   * Instagram Live Producer (RTMP/RTMPS) is the official supported workflow for desktop software.
   */
  getStreamingMode(options?: InstagramBroadcastOptions): InstagramStreamingMode {
    if (options?.accountType === 'PERSONAL' || options?.isLiveEligible === false) {
      return 'UNSUPPORTED';
    }
    return 'LIVE_PRODUCER';
  }

  /**
   * Validates Instagram ingest URL to prevent SSRF and internal network exposure.
   */
  validateIngestUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (!trimmed.startsWith('rtmp://') && !trimmed.startsWith('rtmps://')) {
      return false;
    }

    try {
      const parsed = new URL(trimmed.replace(/^rtmps?:\/\//, 'http://'));
      const host = parsed.hostname.toLowerCase();

      // Disallow local and loopback addresses
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '0.0.0.0' ||
        host.endsWith('.local') ||
        host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        host.startsWith('169.254.')
      ) {
        return false;
      }

      // Check for valid Instagram / Meta RTMP endpoints
      return (
        host === 'live-upload.instagram.com' ||
        host.endsWith('.instagram.com') ||
        host.endsWith('.facebook.com') ||
        host === 'rtmp-api.facebook.com'
      );
    } catch {
      return false;
    }
  }

  /**
   * Validates Instagram Stream Key.
   */
  validateStreamKey(key: string): boolean {
    if (!key || typeof key !== 'string') return false;
    const trimmed = key.trim();
    if (trimmed.length < 4 || trimmed.length > 256) return false;
    // Disallow unconfigured placeholder keys
    if (trimmed.startsWith('x-youtube-key-') || trimmed === '••••••••••••••••') {
      return false;
    }
    return true;
  }

  async createBroadcast(
    _accessToken: string,
    title: string,
    _description?: string,
    options?: InstagramBroadcastOptions,
  ): Promise<{
    platformStreamId: string;
    streamUrl: string;
    streamKey: string;
    producerUrl?: string;
  }> {
    const mode = this.getStreamingMode(options);

    if (mode === 'UNSUPPORTED') {
      throw new BadRequestException(
        'This Instagram account is not eligible for live streaming. Instagram requires a Professional (Creator or Business) account to access Instagram Live Producer.',
      );
    }

    const streamUrl = options?.customStreamUrl?.trim() || InstagramAdapter.DEFAULT_INGEST_URL;
    const streamKey = options?.customStreamKey?.trim();

    if (!this.validateIngestUrl(streamUrl)) {
      throw new BadRequestException(
        `Invalid Instagram RTMPS ingest endpoint: "${streamUrl}". Endpoint must start with rtmps:// and point to live-upload.instagram.com.`,
      );
    }

    if (!streamKey || !this.validateStreamKey(streamKey)) {
      throw new BadRequestException(
        'Instagram Live Producer configuration required. Please open Instagram Live Producer (instagram.com -> Create -> Live video) and enter your Stream Key.',
      );
    }

    const platformStreamId = `ig_broadcast_${Date.now()}`;

    return {
      platformStreamId,
      streamUrl,
      streamKey,
      producerUrl: this.getProducerUrl(),
    };
  }

  async waitForStreamActive(
    _accessToken: string,
    _streamId: string,
    _maxWaitMs: number = 10000,
  ): Promise<boolean> {
    // In Live Producer mode, media delivery to ingest is handled by FFmpeg process tracking
    return true;
  }

  async startBroadcast(
    _accessToken: string,
    _platformStreamId: string,
  ): Promise<void> {
    // Note: Official Instagram Live Producer requires clicking "Go Live" in the web UI at instagram.com
  }

  async stopBroadcast(
    _accessToken: string,
    _platformStreamId: string,
  ): Promise<void> {
    // Local FFmpeg ingest is terminated by the LiveStreamsService pipeline
  }

  async getStatus(
    _accessToken: string,
    _platformStreamId: string,
  ): Promise<string> {
    // Returns active ingest state
    return 'WAITING_FOR_PLATFORM_PREVIEW';
  }

  async deleteBroadcast(
    _accessToken: string,
    _platformStreamId: string,
  ): Promise<void> {
    // Handled locally
  }

  async getViewerUrl(
    _accessToken: string,
    _platformStreamId: string,
  ): Promise<string | null> {
    return 'https://www.instagram.com/';
  }

  getViewerUrlForUsername(username?: string): string {
    if (username) {
      return `https://www.instagram.com/${username}/live/`;
    }
    return 'https://www.instagram.com/';
  }

  getProducerUrl(): string {
    return 'https://www.instagram.com/live/producer';
  }
}
