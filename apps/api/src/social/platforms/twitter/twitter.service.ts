/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import {
  PlatformHandler,
  PlatformOAuthResult,
  PlatformProfile,
} from '../../interfaces/platform-handler.interface';

@Injectable()
export class TwitterService implements PlatformHandler {
  private readonly clientId = process.env.TWITTER_CLIENT_ID;
  private readonly clientSecret = process.env.TWITTER_CLIENT_SECRET;
  private readonly redirectUri =
    process.env.TWITTER_REDIRECT_URI ||
    'http://localhost:3000/api/social/callback/twitter';

  getAuthUrl(state: string): string {
    if (!this.clientId) {
      // Simulation Mode
      return `http://localhost:3000/api/social/callback/twitter?code=mock_twitter_code&state=${state}`;
    }
    // Twitter (X) uses OAuth 2.0 PKCE. For simplicity we supply a standard auth URL or fallbacks.
    return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${this.clientId}&redirect_uri=${encodeURIComponent(
      this.redirectUri,
    )}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=${state}&code_challenge=challenge&code_challenge_method=plain`;
  }

  async exchangeCode(code: string): Promise<PlatformOAuthResult> {
    if (!this.clientId || code.startsWith('mock_')) {
      return {
        accessToken: `mock_twitter_access_token_${Math.random().toString(36).substring(7)}`,
        refreshToken: `mock_twitter_refresh_token_${Math.random().toString(36).substring(7)}`,
        expiresIn: 3600,
        tokenType: 'Bearer',
      };
    }

    try {
      const basicAuth = Buffer.from(
        `${this.clientId}:${this.clientSecret || ''}`,
      ).toString('base64');
      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
          code_verifier: 'challenge',
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error_description || 'Failed to exchange Twitter code',
        );
      }
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (err: any) {
      throw new Error(`Twitter OAuth exchange failed: ${err.message}`);
    }
  }

  async refreshTokens(refreshToken: string): Promise<PlatformOAuthResult> {
    if (refreshToken.startsWith('mock_')) {
      return {
        accessToken: `mock_twitter_access_token_refreshed_${Math.random().toString(36).substring(7)}`,
        refreshToken,
        expiresIn: 3600,
      };
    }

    try {
      const basicAuth = Buffer.from(
        `${this.clientId}:${this.clientSecret || ''}`,
      ).toString('base64');
      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.clientId || '',
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error_description || 'Failed to refresh Twitter token',
        );
      }
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresIn: data.expires_in,
      };
    } catch (err: any) {
      throw new Error(`Twitter OAuth refresh failed: ${err.message}`);
    }
  }

  async fetchProfile(accessToken: string): Promise<PlatformProfile> {
    if (accessToken.startsWith('mock_')) {
      return {
        platformUserId: 'tw_user_mock_123',
        name: 'NexaSocialApp',
        avatar:
          'https://images.unsplash.com/photo-1611605698335-8b15d27e0397?w=150',
        metadata: {
          followers: 12040,
          tweetsCount: 423,
        },
      };
    }

    try {
      const response = await fetch(
        'https://api.twitter.com/2/users/me?user.fields=profile_image_url',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch Twitter user profile');
      }
      return {
        platformUserId: data.data.id,
        name: data.data.username,
        avatar: data.data.profile_image_url,
        metadata: {
          name: data.data.name,
        },
      };
    } catch (err: any) {
      throw new Error(`Twitter profile fetch failed: ${err.message}`);
    }
  }
}
