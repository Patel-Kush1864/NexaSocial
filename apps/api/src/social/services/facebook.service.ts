import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface FacebookUser {
  id: string;
  name: string;
  email?: string;
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
}

export interface FacebookTokenResponse {
  accessToken: string;
  tokenType?: string;
  expiresIn?: number;
}

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);

  constructor(private readonly configService: ConfigService) {}

  private get appId(): string {
    return (
      this.configService.get<string>('oauth.facebook.appId') ||
      process.env.FACEBOOK_APP_ID ||
      process.env.FACEBOOK_CLIENT_ID ||
      ''
    );
  }

  private get appSecret(): string {
    return (
      this.configService.get<string>('oauth.facebook.appSecret') ||
      process.env.FACEBOOK_APP_SECRET ||
      process.env.FACEBOOK_CLIENT_SECRET ||
      ''
    );
  }

  private get redirectUri(): string {
    return (
      this.configService.get<string>('oauth.facebook.redirectUri') ||
      process.env.FACEBOOK_CALLBACK_URL ||
      process.env.FACEBOOK_REDIRECT_URI ||
      'http://localhost:5000/api/social/facebook/callback'
    );
  }

  private get graphVersion(): string {
    return (
      this.configService.get<string>('oauth.facebook.graphVersion') ||
      process.env.FACEBOOK_GRAPH_VERSION ||
      'v23.0'
    );
  }

  private get scopes(): string[] {
    const configuredScopes = this.configService.get<string[]>(
      'oauth.facebook.scopes',
    );
    if (configuredScopes && configuredScopes.length > 0) {
      return configuredScopes;
    }
    return ['public_profile', 'email'];
  }

  private get isConfigured(): boolean {
    return (
      !!this.appId &&
      !this.appId.startsWith('dummy-') &&
      !!this.appSecret &&
      !this.appSecret.startsWith('dummy-')
    );
  }

  /**
   * Generates Facebook OAuth URL for user authorization.
   */
  generateAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(','),
      state,
      response_type: 'code',
    });

    return `https://www.facebook.com/${this.graphVersion}/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for long-lived User Access Token.
   */
  async exchangeCodeForToken(code: string): Promise<FacebookTokenResponse> {
    if (!this.isConfigured || code.startsWith('mock_')) {
      return {
        accessToken: `mock_facebook_user_access_token_${Math.random().toString(36).substring(7)}`,
        tokenType: 'bearer',
        expiresIn: 5184000, // 60 days
      };
    }

    try {
      const url = `https://graph.facebook.com/${this.graphVersion}/oauth/access_token`;
      const params = new URLSearchParams({
        client_id: this.appId,
        client_secret: this.appSecret,
        redirect_uri: this.redirectUri,
        code,
      });

      const response = await fetch(`${url}?${params.toString()}`, {
        method: 'GET',
      });

      const data = (await response.json()) as {
        access_token?: string;
        token_type?: string;
        expires_in?: number;
        error?: { message?: string };
      };
      if (!response.ok) {
        throw new BadRequestException(
          data.error?.message ||
            'Failed to exchange Facebook authorization code',
        );
      }

      return {
        accessToken: data.access_token || '',
        tokenType: data.token_type,
        expiresIn: data.expires_in,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Facebook token exchange failed: ${msg}`);
      throw new BadRequestException(`Facebook OAuth exchange failed: ${msg}`);
    }
  }

  /**
   * Retrieves Facebook User Profile details.
   */
  async getFacebookUser(accessToken: string): Promise<FacebookUser> {
    if (accessToken.startsWith('mock_')) {
      return {
        id: 'mock_fb_user_10158823901',
        name: 'Alex Johnson',
        email: 'alex.johnson@example.com',
      };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.graphVersion}/me?fields=id,name,email&access_token=${encodeURIComponent(
          accessToken,
        )}`,
      );
      const data = (await response.json()) as {
        id?: string;
        name?: string;
        email?: string;
        error?: { message?: string };
      };

      if (!response.ok) {
        throw new BadRequestException(
          data.error?.message || 'Failed to fetch Facebook user information',
        );
      }

      return {
        id: data.id || '',
        name: data.name || '',
        email: data.email,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Facebook user fetch failed: ${msg}`);
      throw new BadRequestException(
        `Failed to retrieve Facebook user profile: ${msg}`,
      );
    }
  }

  /**
   * Retrieves all Facebook Pages managed by the user.
   */
  async getFacebookPages(accessToken: string): Promise<FacebookPage[]> {
    if (accessToken.startsWith('mock_')) {
      return [
        {
          id: 'mock_page_882910401',
          name: 'NexaSocial Official Page',
          access_token: `mock_page_access_token_882910401`,
          category: 'Media & News Company',
        },
        {
          id: 'mock_page_882910402',
          name: 'NexaSocial Community',
          access_token: `mock_page_access_token_882910402`,
          category: 'Community',
        },
      ];
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.graphVersion}/me/accounts?fields=id,name,access_token,category&access_token=${encodeURIComponent(
          accessToken,
        )}`,
      );
      const data = (await response.json()) as {
        data?: Array<{
          id: string;
          name: string;
          access_token: string;
          category?: string;
        }>;
        error?: { message?: string };
      };

      if (!response.ok) {
        this.logger.warn(
          `Facebook Pages fetch note: ${data.error?.message || 'Page permissions not granted during basic profile login.'}`,
        );
        return [];
      }

      return (data.data || []).map((page) => ({
        id: page.id,
        name: page.name,
        access_token: page.access_token,
        category: page.category,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Could not retrieve Facebook pages: ${msg}`);
      return [];
    }
  }
}
