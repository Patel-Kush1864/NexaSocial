/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';
import {
  PlatformHandler,
  PlatformOAuthResult,
  PlatformProfile,
} from '../../interfaces/platform-handler.interface';

@Injectable()
export class FacebookService implements PlatformHandler {
  private readonly clientId = process.env.FACEBOOK_CLIENT_ID;
  private readonly clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
  private readonly redirectUri =
    process.env.FACEBOOK_REDIRECT_URI ||
    'http://localhost:3000/api/social/callback/facebook';

  getAuthUrl(state: string): string {
    if (!this.clientId) {
      // Simulation Mode
      return `http://localhost:3000/api/social/callback/facebook?code=mock_facebook_code&state=${state}`;
    }
    return `https://www.facebook.com/v16.0/dialog/oauth?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(
      this.redirectUri,
    )}&scope=pages_show_list,pages_manage_posts,pages_read_engagement,publish_video&state=${state}`;
  }

  async exchangeCode(code: string): Promise<PlatformOAuthResult> {
    if (!this.clientId || code.startsWith('mock_')) {
      return {
        accessToken: `mock_facebook_access_token_${Math.random().toString(36).substring(7)}`,
        expiresIn: 3600,
        tokenType: 'Bearer',
      };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v16.0/oauth/access_token?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(
          this.redirectUri,
        )}&client_secret=${this.clientSecret || ''}&code=${code}`,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error?.message || 'Failed to exchange Facebook token',
        );
      }
      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
      };
    } catch (err: any) {
      throw new Error(`Facebook OAuth exchange failed: ${err.message}`);
    }
  }

  async refreshTokens(refreshToken: string): Promise<PlatformOAuthResult> {
    // Facebook Graph API access tokens are refreshed using long-lived tokens instead.
    // We mock/bypass this.
    return {
      accessToken: refreshToken.startsWith('mock_')
        ? `mock_facebook_access_token_refreshed_${Math.random().toString(36).substring(7)}`
        : refreshToken,
      refreshToken,
      expiresIn: 3600,
    };
  }

  async fetchProfile(accessToken: string): Promise<PlatformProfile> {
    if (accessToken.startsWith('mock_')) {
      return {
        platformUserId: 'fb_page_mock_123',
        name: 'NexaSocial Facebook Page',
        avatar:
          'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=150',
        metadata: {
          likes: 8520,
          followers: 9040,
        },
      };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/me?fields=id,name,picture.type(normal)&access_token=${accessToken}`,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error?.message || 'Failed to fetch Facebook profile',
        );
      }
      return {
        platformUserId: data.id,
        name: data.name,
        avatar: data.picture?.data?.url,
        metadata: {
          likes: 0,
        },
      };
    } catch (err: any) {
      throw new Error(`Facebook profile fetch failed: ${err.message}`);
    }
  }
}
