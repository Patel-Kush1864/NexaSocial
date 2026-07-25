/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import {
  PlatformHandler,
  PlatformOAuthResult,
  PlatformProfile,
} from '../../interfaces/platform-handler.interface';

@Injectable()
export class YoutubeService implements PlatformHandler {
  private readonly clientId = process.env.YOUTUBE_CLIENT_ID;
  private readonly clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  private readonly redirectUri =
    process.env.YOUTUBE_REDIRECT_URI ||
    'http://localhost:3000/api/social/callback/youtube';

  getAuthUrl(state: string): string {
    if (!this.clientId) {
      // Simulation Mode
      return `http://localhost:3000/api/social/callback/youtube?code=mock_youtube_code&state=${state}`;
    }
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(
      this.redirectUri,
    )}&response_type=code&scope=https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl&state=${state}&access_type=offline&prompt=consent`;
  }

  async exchangeCode(code: string): Promise<PlatformOAuthResult> {
    if (!this.clientId || code.startsWith('mock_')) {
      return {
        accessToken: `mock_youtube_access_token_${Math.random().toString(36).substring(7)}`,
        refreshToken: `mock_youtube_refresh_token_${Math.random().toString(36).substring(7)}`,
        expiresIn: 3600,
        scope: 'youtube.readonly',
        tokenType: 'Bearer',
      };
    }

    // Real API fetch block
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret || '',
          redirect_uri: this.redirectUri,
          grant_type: 'authorization_code',
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error_description ||
            data.error ||
            'Failed to exchange Google OAuth code',
        );
      }
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        scope: data.scope,
        tokenType: data.token_type,
      };
    } catch (err: any) {
      throw new Error(`Google OAuth exchange failed: ${err.message}`);
    }
  }

  async refreshTokens(refreshToken: string): Promise<PlatformOAuthResult> {
    if (refreshToken.startsWith('mock_')) {
      return {
        accessToken: `mock_youtube_access_token_refreshed_${Math.random().toString(36).substring(7)}`,
        refreshToken,
        expiresIn: 3600,
      };
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.clientId || '',
          client_secret: this.clientSecret || '',
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error_description || 'Failed to refresh Google token',
        );
      }
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresIn: data.expires_in,
      };
    } catch (err: any) {
      throw new Error(`Google OAuth refresh failed: ${err.message}`);
    }
  }

  async fetchProfile(accessToken: string): Promise<PlatformProfile> {
    if (accessToken.startsWith('mock_')) {
      return {
        platformUserId: 'yt_channel_mock_123',
        name: 'NexaSocial YouTube Channel',
        avatar:
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
        metadata: {
          subscribers: 28400,
          views: 120500,
          streamKey: 'live_mock_youtube_stream_key_abc123',
        },
      };
    }

    try {
      const response = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error?.message || 'Failed to fetch YouTube profile',
        );
      }
      const item = data.items?.[0];
      if (!item) {
        throw new Error('No YouTube channel found for this access token');
      }
      return {
        platformUserId: item.id,
        name: item.snippet.title,
        avatar: item.snippet.thumbnails?.default?.url,
        metadata: {
          subscribers: parseInt(item.statistics.subscriberCount || '0', 10),
          views: parseInt(item.statistics.viewCount || '0', 10),
          videoCount: parseInt(item.statistics.videoCount || '0', 10),
        },
      };
    } catch (err: any) {
      throw new Error(`YouTube profile fetch failed: ${err.message}`);
    }
  }
}
