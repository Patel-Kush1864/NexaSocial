/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';
import {
  PlatformHandler,
  PlatformOAuthResult,
  PlatformProfile,
} from '../../interfaces/platform-handler.interface';

@Injectable()
export class InstagramService implements PlatformHandler {
  private readonly clientId = process.env.INSTAGRAM_CLIENT_ID;
  private readonly clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  private readonly redirectUri =
    process.env.INSTAGRAM_REDIRECT_URI ||
    'http://localhost:3000/api/social/callback/instagram';

  getAuthUrl(state: string): string {
    if (!this.clientId) {
      // Simulation Mode
      return `http://localhost:3000/api/social/callback/instagram?code=mock_instagram_code&state=${state}`;
    }
    return `https://api.instagram.com/oauth/authorize?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(
      this.redirectUri,
    )}&scope=user_profile,user_media&response_type=code&state=${state}`;
  }

  async exchangeCode(code: string): Promise<PlatformOAuthResult> {
    if (!this.clientId || code.startsWith('mock_')) {
      return {
        accessToken: `mock_instagram_access_token_${Math.random().toString(36).substring(7)}`,
        expiresIn: 3600,
        tokenType: 'Bearer',
      };
    }

    try {
      const response = await fetch(
        'https://api.instagram.com/oauth/access_token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret || '',
            grant_type: 'authorization_code',
            redirect_uri: this.redirectUri,
            code,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error_message || 'Failed to exchange Instagram OAuth token',
        );
      }
      return {
        accessToken: data.access_token,
        expiresIn: 3600, // Short-lived token expires in 1 hour usually
      };
    } catch (err: any) {
      throw new Error(`Instagram OAuth exchange failed: ${err.message}`);
    }
  }

  async refreshTokens(refreshToken: string): Promise<PlatformOAuthResult> {
    return {
      accessToken: refreshToken.startsWith('mock_')
        ? `mock_instagram_access_token_refreshed_${Math.random().toString(36).substring(7)}`
        : refreshToken,
      refreshToken,
      expiresIn: 3600,
    };
  }

  async fetchProfile(accessToken: string): Promise<PlatformProfile> {
    if (accessToken.startsWith('mock_')) {
      return {
        platformUserId: 'ig_user_mock_123',
        name: 'nexasocial_business',
        avatar:
          'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=150',
        metadata: {
          followers: 43200,
          following: 150,
          postsCount: 140,
        },
      };
    }

    try {
      const response = await fetch(
        `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${accessToken}`,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error?.message || 'Failed to fetch Instagram profile',
        );
      }
      return {
        platformUserId: data.id,
        name: data.username,
        metadata: {
          accountType: data.account_type,
        },
      };
    } catch (err: any) {
      throw new Error(`Instagram profile fetch failed: ${err.message}`);
    }
  }
}
