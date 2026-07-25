/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import {
  PlatformHandler,
  PlatformOAuthResult,
  PlatformProfile,
} from '../../interfaces/platform-handler.interface';

@Injectable()
export class TwitchService implements PlatformHandler {
  private readonly clientId = process.env.TWITCH_CLIENT_ID;
  private readonly clientSecret = process.env.TWITCH_CLIENT_SECRET;
  private readonly redirectUri =
    process.env.TWITCH_REDIRECT_URI ||
    'http://localhost:3000/api/social/callback/twitch';

  getAuthUrl(state: string): string {
    if (!this.clientId) {
      // Simulation Mode
      return `http://localhost:3000/api/social/callback/twitch?code=mock_twitch_code&state=${state}`;
    }
    return `https://id.twitch.tv/oauth2/authorize?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(
      this.redirectUri,
    )}&response_type=code&scope=channel:read:stream_key%20user:read:email%20chat:read&state=${state}`;
  }

  async exchangeCode(code: string): Promise<PlatformOAuthResult> {
    if (!this.clientId || code.startsWith('mock_')) {
      return {
        accessToken: `mock_twitch_access_token_${Math.random().toString(36).substring(7)}`,
        refreshToken: `mock_twitch_refresh_token_${Math.random().toString(36).substring(7)}`,
        expiresIn: 3600,
        tokenType: 'Bearer',
      };
    }

    try {
      const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret || '',
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to exchange Twitch code');
      }
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (err: any) {
      throw new Error(`Twitch OAuth exchange failed: ${err.message}`);
    }
  }

  async refreshTokens(refreshToken: string): Promise<PlatformOAuthResult> {
    if (refreshToken.startsWith('mock_')) {
      return {
        accessToken: `mock_twitch_access_token_refreshed_${Math.random().toString(36).substring(7)}`,
        refreshToken,
        expiresIn: 3600,
      };
    }

    try {
      const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.clientId || '',
          client_secret: this.clientSecret || '',
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to refresh Twitch token');
      }
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresIn: data.expires_in,
      };
    } catch (err: any) {
      throw new Error(`Twitch OAuth refresh failed: ${err.message}`);
    }
  }

  async fetchProfile(accessToken: string): Promise<PlatformProfile> {
    if (accessToken.startsWith('mock_')) {
      return {
        platformUserId: 'tw_channel_mock_123',
        name: 'nexasocial_stream',
        avatar:
          'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=150',
        metadata: {
          followers: 1830,
          streamKey: 'live_mock_twitch_stream_key_123',
        },
      };
    }

    try {
      const response = await fetch('https://api.twitch.tv/helix/users', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Client-Id': this.clientId || '',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch Twitch user profile');
      }
      const user = data.data?.[0];
      if (!user) {
        throw new Error('No Twitch user profile found');
      }
      return {
        platformUserId: user.id,
        name: user.display_name,
        avatar: user.profile_image_url,
        metadata: {
          email: user.email,
        },
      };
    } catch (err: any) {
      throw new Error(`Twitch profile fetch failed: ${err.message}`);
    }
  }
}
