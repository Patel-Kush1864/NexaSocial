/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';
import {
  PlatformHandler,
  PlatformOAuthResult,
  PlatformProfile,
} from '../../interfaces/platform-handler.interface';

@Injectable()
export class LinkedinService implements PlatformHandler {
  private readonly clientId = process.env.LINKEDIN_CLIENT_ID;
  private readonly clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  private readonly redirectUri =
    process.env.LINKEDIN_REDIRECT_URI ||
    'http://localhost:3000/api/social/callback/linkedin';

  getAuthUrl(state: string): string {
    if (!this.clientId) {
      // Simulation Mode
      return `http://localhost:3000/api/social/callback/linkedin?code=mock_linkedin_code&state=${state}`;
    }
    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${this.clientId}&redirect_uri=${encodeURIComponent(
      this.redirectUri,
    )}&state=${state}&scope=r_liteprofile%20r_emailaddress%20w_member_social`;
  }

  async exchangeCode(code: string): Promise<PlatformOAuthResult> {
    if (!this.clientId || code.startsWith('mock_')) {
      return {
        accessToken: `mock_linkedin_access_token_${Math.random().toString(36).substring(7)}`,
        expiresIn: 3600,
        tokenType: 'Bearer',
      };
    }

    try {
      const response = await fetch(
        'https://www.linkedin.com/oauth/v2/accessToken',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: this.redirectUri,
            client_id: this.clientId,
            client_secret: this.clientSecret || '',
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error_description || 'Failed to exchange LinkedIn token',
        );
      }
      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
      };
    } catch (err: any) {
      throw new Error(`LinkedIn OAuth exchange failed: ${err.message}`);
    }
  }

  async refreshTokens(refreshToken: string): Promise<PlatformOAuthResult> {
    return {
      accessToken: refreshToken.startsWith('mock_')
        ? `mock_linkedin_access_token_refreshed_${Math.random().toString(36).substring(7)}`
        : refreshToken,
      refreshToken,
      expiresIn: 3600,
    };
  }

  async fetchProfile(accessToken: string): Promise<PlatformProfile> {
    if (accessToken.startsWith('mock_')) {
      return {
        platformUserId: 'li_profile_mock_123',
        name: 'NexaSocial Professional',
        avatar:
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        metadata: {
          connections: 520,
          organization: 'NexaSocial Corp',
        },
      };
    }

    try {
      const response = await fetch('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch LinkedIn profile');
      }
      const name = `${data.localizedFirstName} ${data.localizedLastName}`;
      return {
        platformUserId: data.id,
        name,
        metadata: {
          vanityName: data.vanityName,
        },
      };
    } catch (err: any) {
      throw new Error(`LinkedIn profile fetch failed: ${err.message}`);
    }
  }
}
