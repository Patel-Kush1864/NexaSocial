/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import {
  PlatformHandler,
  PlatformOAuthResult,
  PlatformProfile,
} from '../../interfaces/platform-handler.interface';

@Injectable()
export class TiktokService implements PlatformHandler {
  private readonly clientId = process.env.TIKTOK_CLIENT_ID;
  private readonly clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  private readonly redirectUri =
    process.env.TIKTOK_REDIRECT_URI ||
    'http://localhost:3000/api/social/callback/tiktok';

  getAuthUrl(state: string): string {
    if (!this.clientId) {
      // Simulation Mode
      return `http://localhost:3000/api/social/callback/tiktok?code=mock_tiktok_code&state=${state}`;
    }
    return `https://www.tiktok.com/v2/auth/authorize/?client_key=${this.clientId}&scope=user.info.basic,video.list&response_type=code&redirect_uri=${encodeURIComponent(
      this.redirectUri,
    )}&state=${state}`;
  }

  async exchangeCode(code: string): Promise<PlatformOAuthResult> {
    if (!this.clientId || code.startsWith('mock_')) {
      return {
        accessToken: `mock_tiktok_access_token_${Math.random().toString(36).substring(7)}`,
        refreshToken: `mock_tiktok_refresh_token_${Math.random().toString(36).substring(7)}`,
        expiresIn: 3600,
        tokenType: 'Bearer',
      };
    }

    try {
      const response = await fetch(
        'https://open.tiktokapis.com/v2/oauth/token/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_key: this.clientId,
            client_secret: this.clientSecret || '',
            code,
            grant_type: 'authorization_code',
            redirect_uri: this.redirectUri,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error_description || 'Failed to exchange TikTok code',
        );
      }
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (err: any) {
      throw new Error(`TikTok OAuth exchange failed: ${err.message}`);
    }
  }

  async refreshTokens(refreshToken: string): Promise<PlatformOAuthResult> {
    if (refreshToken.startsWith('mock_')) {
      return {
        accessToken: `mock_tiktok_access_token_refreshed_${Math.random().toString(36).substring(7)}`,
        refreshToken,
        expiresIn: 3600,
      };
    }

    try {
      const response = await fetch(
        'https://open.tiktokapis.com/v2/oauth/token/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_key: this.clientId || '',
            client_secret: this.clientSecret || '',
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error_description || 'Failed to refresh TikTok token',
        );
      }
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresIn: data.expires_in,
      };
    } catch (err: any) {
      throw new Error(`TikTok OAuth refresh failed: ${err.message}`);
    }
  }

  async fetchProfile(accessToken: string): Promise<PlatformProfile> {
    if (accessToken.startsWith('mock_')) {
      return {
        platformUserId: 'tt_user_mock_123',
        name: 'nexasocial_creator',
        avatar:
          'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150',
        metadata: {
          followers: 84200,
          likesCount: 154000,
        },
      };
    }

    try {
      const response = await fetch(
        'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error?.message || 'Failed to fetch TikTok user profile',
        );
      }
      const user = data.data?.user;
      if (!user) {
        throw new Error('No TikTok user profile found');
      }
      return {
        platformUserId: user.open_id,
        name: user.display_name,
        avatar: user.avatar_url,
        metadata: {
          unionId: user.union_id,
        },
      };
    } catch (err: any) {
      throw new Error(`TikTok profile fetch failed: ${err.message}`);
    }
  }
}
