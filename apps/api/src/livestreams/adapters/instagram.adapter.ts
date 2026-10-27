/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/require-await */
import { Injectable, BadRequestException } from '@nestjs/common';
import { PlatformAdapter } from '../interfaces/platform-adapter.interface';

export type InstagramStreamingMode =
  'AUTOMATED' | 'LIVE_PRODUCER' | 'UNSUPPORTED';

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
  getStreamingMode(
    options?: InstagramBroadcastOptions,
  ): InstagramStreamingMode {
    if (
      options?.accountType === 'PERSONAL' ||
      options?.isLiveEligible === false
    ) {
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

      // Disallow local, loopback, and private addresses
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '0.0.0.0' ||
        host === '::1' ||
        host.endsWith('.local') ||
        host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        host.startsWith('169.254.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
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
   * Safely builds the complete RTMP destination without double-appending stream keys.
   */
  buildRtmpDestination(serverUrl: string, streamKey: string): string {
    const cleanUrl = (serverUrl || InstagramAdapter.DEFAULT_INGEST_URL).trim();
    const cleanKey = (streamKey || '').trim();

    if (!cleanKey) return cleanUrl;

    if (cleanUrl.endsWith(`/${cleanKey}`) || cleanUrl.endsWith(cleanKey)) {
      return cleanUrl;
    }

    const base = cleanUrl.replace(/\/+$/, '');
    const key = cleanKey.replace(/^\/+/, '');
    return `${base}/${key}`;
  }

  /**
   * Validates Instagram Stream Key.
   */
  validateStreamKey(key: string): boolean {
    if (!key || typeof key !== 'string') return false;
    const trimmed = key.trim();
    if (trimmed.length < 4 || trimmed.length > 256) return false;
    // Disallow unconfigured placeholder keys
    if (
      trimmed.startsWith('x-youtube-key-') ||
      trimmed === '••••••••••••••••'
    ) {
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

    const streamUrl =
      options?.customStreamUrl?.trim() || InstagramAdapter.DEFAULT_INGEST_URL;
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
    // Meta Instagram Live Producer does not provide a direct public broadcast URL
    return null;
  }

  /**
   * Returns Instagram profile URL for an account username without fabricating any /live/ suffix.
   */
  getProfileUrl(username?: string): string | null {
    if (!username) return null;
    const clean = username.trim().replace(/^@/, '');
    return clean ? `https://www.instagram.com/${clean}/` : null;
  }

  getProducerUrl(): string {
    return 'https://www.instagram.com/';
  }

  /**
   * Evaluates official Meta Graph API to verify whether an Instagram broadcast is currently live.
   * If OAuth access token and platformUserId are present, queries GET /{ig-user-id}/live_media.
   * Safe diagnostics: NEVER logs access tokens or credential parameters.
   */
  async checkOfficialLiveStatus(
    accessToken?: string,
    platformUserId?: string,
  ): Promise<{
    isLive: boolean;
    liveMediaId?: string;
    requiresManualConfirmation: boolean;
    apiPublishSupported: boolean;
    limitationReason: string;
    metaResponseError?: string;
    statusCode?: number;
    isMockAccount?: boolean;
  }> {
    const metaLimitation =
      "Meta's official Instagram Graph API does not provide a programmatic endpoint to initiate or publish live streams. Desktop broadcasts must be created on Instagram (instagram.com -> Create (+) -> Live video).";

    if (
      !accessToken ||
      !platformUserId ||
      accessToken.startsWith('mock_') ||
      platformUserId.startsWith('mock_')
    ) {
      const isMock = Boolean(
        accessToken?.startsWith('mock_') || platformUserId?.startsWith('mock_'),
      );
      const reason =
        !accessToken || !platformUserId
          ? 'No Meta OAuth access credentials linked to this Instagram destination.'
          : 'Mock OAuth credentials detected (mock_ig_user_101). Real Meta Graph API check bypassed.';
      console.log(
        `\x1b[90m[INSTAGRAM_VERIFY] platformUserId=${platformUserId || 'none'} status=UNVERIFIED isMock=${isMock} reason="${reason}"\x1b[0m`,
      );
      return {
        isLive: false,
        requiresManualConfirmation: true,
        apiPublishSupported: false,
        isMockAccount: isMock,
        limitationReason: `${metaLimitation} (${reason})`,
        metaResponseError: isMock ? 'MOCK_ACCOUNT_DETECTED' : 'NO_CREDENTIALS',
      };
    }

    try {
      const sanitizedUrl = `https://graph.facebook.com/v22.0/${encodeURIComponent(platformUserId)}/live_media?fields=id,media_type,media_product_type,broadcast_status`;
      console.log(
        `\x1b[36m[INSTAGRAM_VERIFY] Querying Meta Graph API endpoint: GET ${sanitizedUrl}\x1b[0m`,
      );

      const requestUrl = `${sanitizedUrl}&access_token=${encodeURIComponent(accessToken)}`;
      const res = await fetch(requestUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      const data = await res.json().catch(() => ({}));
      console.log(
        `\x1b[36m[INSTAGRAM_VERIFY] Meta Graph API response status=${res.status} itemsCount=${Array.isArray(data?.data) ? data.data.length : 0}\x1b[0m`,
      );

      if (res.ok && Array.isArray(data?.data) && data.data.length > 0) {
        const liveItem = data.data[0];
        console.log(
          `\x1b[32m[INSTAGRAM_VERIFY] Verified LIVE on Instagram! Live Media ID: ${liveItem.id}\x1b[0m`,
        );
        return {
          isLive: true,
          liveMediaId: liveItem.id,
          requiresManualConfirmation: false,
          apiPublishSupported: false,
          limitationReason: metaLimitation,
          statusCode: res.status,
        };
      }

      const metaErr = data?.error?.message
        ? String(data.error.message)
        : undefined;
      if (metaErr) {
        console.warn(
          `\x1b[33m[INSTAGRAM_VERIFY] Meta Graph API returned notice: ${metaErr}\x1b[0m`,
        );
      }

      return {
        isLive: false,
        requiresManualConfirmation: true,
        apiPublishSupported: false,
        limitationReason: metaLimitation,
        metaResponseError: metaErr,
        statusCode: res.status,
      };
    } catch (fetchErr: any) {
      const errMsg =
        fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      console.warn(
        `\x1b[33m[INSTAGRAM_VERIFY] Meta Graph API connection failed: ${errMsg}\x1b[0m`,
      );
      return {
        isLive: false,
        requiresManualConfirmation: true,
        apiPublishSupported: false,
        limitationReason: metaLimitation,
        metaResponseError: errMsg,
      };
    }
  }

  getViewerAppNotice(): string {
    return 'Live broadcasts are viewed from your profile avatar in the Instagram mobile app. Meta does not generate direct web broadcast URLs for Instagram Live Producer streams.';
  }
}
