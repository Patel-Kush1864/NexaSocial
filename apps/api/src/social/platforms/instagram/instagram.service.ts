import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PlatformHandler,
  PlatformOAuthResult,
  PlatformProfile,
} from '../../interfaces/platform-handler.interface';

export interface InstagramEligibilityResult {
  isEligible: boolean;
  accountType: 'BUSINESS' | 'MEDIA_CREATOR' | 'PERSONAL' | 'UNKNOWN';
  reason?: string;
  requiredAction?: string;
}

@Injectable()
export class InstagramService implements PlatformHandler, OnModuleInit {
  private readonly logger = new Logger(InstagramService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.validateConfiguration();
  }

  public validateConfiguration(): boolean {
    const clientId = this.clientId;
    const clientSecret = this.clientSecret;
    const redirectUri = this.canonicalRedirectUri;

    if (!clientId || clientId === 'undefined') {
      this.logger.warn(
        '⚠️ [InstagramService] Missing INSTAGRAM_CLIENT_ID in server environment. Instagram OAuth connection will be unavailable.',
      );
      return false;
    }

    if (!clientSecret || clientSecret === 'undefined') {
      this.logger.warn(
        '⚠️ [InstagramService] Missing INSTAGRAM_CLIENT_SECRET in server environment. Token exchange will fail.',
      );
      return false;
    }

    this.logger.log(
      `✅ [InstagramService] Initialized. Client ID: ${clientId} | Canonical Redirect URI: ${redirectUri}`,
    );

    return true;
  }

  private get clientId(): string | undefined {
    return (
      this.configService.get<string>('oauth.instagram.clientId') ||
      this.configService.get<string>('INSTAGRAM_CLIENT_ID') ||
      process.env.INSTAGRAM_CLIENT_ID
    )?.trim();
  }

  private get clientSecret(): string | undefined {
    return (
      this.configService.get<string>('oauth.instagram.clientSecret') ||
      this.configService.get<string>('INSTAGRAM_CLIENT_SECRET') ||
      process.env.INSTAGRAM_CLIENT_SECRET
    )?.trim();
  }

  /**
   * Returns the single canonical redirect URI configured for Instagram OAuth.
   * Both authorization request and token exchange use this exact URI.
   */
  public get canonicalRedirectUri(): string {
    const explicitUri = (
      this.configService.get<string>('INSTAGRAM_REDIRECT_URI') ||
      this.configService.get<string>('oauth.instagram.redirectUri') ||
      process.env.INSTAGRAM_REDIRECT_URI
    )?.trim();

    if (explicitUri) {
      return explicitUri.replace(/\/+$/, '');
    }

    const appUrl = (
      this.configService.get<string>('APP_URL') ||
      process.env.APP_URL ||
      'http://localhost:5000'
    )
      .trim()
      .replace(/\/+$/, '');

    return `${appUrl}/api/social/callback/instagram`;
  }

  getAuthUrl(state: string): string {
    const clientId = this.clientId;
    if (!clientId || clientId === 'undefined') {
      throw new InternalServerErrorException(
        'Instagram OAuth is not configured. Missing INSTAGRAM_CLIENT_ID in server environment.',
      );
    }

    const redirectUri = this.canonicalRedirectUri;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'instagram_business_basic',
      response_type: 'code',
      state,
    });

    const authUrl = `https://www.instagram.com/oauth/authorize?${params.toString()}`;

    // Safe diagnostic logging (no secrets or sensitive data)
    this.logger.log(
      `[InstagramOAuth Step 1: Dialog] Client ID: ${clientId} | Canonical Redirect URI: ${redirectUri}`,
    );

    return authUrl;
  }

  async exchangeCode(
    code: string,
    redirectUriOverride?: string,
  ): Promise<PlatformOAuthResult> {
    const clientId = this.clientId;
    const clientSecret = this.clientSecret;

    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException(
        'Instagram OAuth credentials not configured on server.',
      );
    }

    // Use dialog redirect URI from state if available, otherwise fallback to canonical
    const redirectUri = (
      redirectUriOverride || this.canonicalRedirectUri
    ).trim().replace(/\/+$/, '');

    // Strip Meta's trailing fragment if present (#_ or /#_)
    const cleanCode = code ? code.replace(/#_.*$/, '').trim() : '';

    if (!cleanCode) {
      throw new BadRequestException(
        'Instagram OAuth authorization code is missing or empty.',
      );
    }

    // Safe diagnostic logging (no client secrets, auth code contents, or tokens logged)
    this.logger.log(
      `[InstagramOAuth Step 2: Exchange] Client ID: ${clientId} | Redirect URI: ${redirectUri} | Code length: ${cleanCode.length}`,
    );

    if (redirectUriOverride && redirectUriOverride !== this.canonicalRedirectUri) {
      this.logger.warn(
        `[InstagramOAuth] Redirect URI discrepancy: dialog URI was "${redirectUriOverride}" but canonical URI is "${this.canonicalRedirectUri}". Using dialog URI.`,
      );
    }

    if (cleanCode.startsWith('mock_')) {
      return {
        accessToken: 'mock_instagram_access_token_123',
        expiresIn: 5184000,
        tokenType: 'Bearer',
      };
    }

    try {
      const formData = new URLSearchParams();
      formData.append('client_id', clientId);
      formData.append('client_secret', clientSecret);
      formData.append('grant_type', 'authorization_code');
      formData.append('redirect_uri', redirectUri);
      formData.append('code', cleanCode);

      const response = await fetch(
        'https://api.instagram.com/oauth/access_token',
        {
          method: 'POST',
          body: formData,
        },
      );
      const data = await response.json();
      if (!response.ok) {
        const errorDetail =
          data.error_message ||
          data.error?.message ||
          'Failed to exchange Instagram OAuth authorization code';

        this.logger.error(
          `[InstagramOAuth Step 2 Failed] Status: ${response.status} | Error: ${errorDetail} | Redirect URI used: ${redirectUri}`,
        );

        throw new Error(errorDetail);
      }

      const shortLivedToken = data.access_token;
      if (!shortLivedToken) {
        throw new Error('No access_token returned by Instagram token endpoint');
      }

      // Upgrade short-lived token to 60-day long-lived token
      try {
        const longLivedResult = await this.exchangeForLongLivedToken(
          shortLivedToken,
          clientSecret,
        );
        return longLivedResult;
      } catch (upgradeErr: any) {
        this.logger.warn(
          `[InstagramService] Failed to upgrade to long-lived token, falling back to short-lived: ${upgradeErr.message}`,
        );
        return {
          accessToken: shortLivedToken,
          expiresIn: data.expires_in || 3600,
          tokenType: 'Bearer',
        };
      }
    } catch (err: any) {
      throw new BadRequestException(
        `Instagram OAuth exchange failed: ${err.message}`,
      );
    }
  }

  /**
   * Exchanges a short-lived Instagram user access token for a 60-day long-lived token.
   * Endpoint: GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token
   */
  async exchangeForLongLivedToken(
    shortLivedToken: string,
    clientSecret: string,
  ): Promise<PlatformOAuthResult> {
    const url = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(
      clientSecret,
    )}&access_token=${encodeURIComponent(shortLivedToken)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || !data.access_token) {
      throw new Error(
        data.error?.message || 'Failed to exchange for long-lived Instagram token',
      );
    }

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in || 5184000, // 60 days in seconds
      tokenType: data.token_type || 'Bearer',
    };
  }

  /**
   * Refreshes an unexpired long-lived Instagram user access token.
   * Endpoint: GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token
   */
  async refreshTokens(refreshToken: string): Promise<PlatformOAuthResult> {
    try {
      const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(
        refreshToken,
      )}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || !data.access_token) {
        throw new Error(
          data.error?.message || 'Failed to refresh Instagram long-lived token',
        );
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.access_token,
        expiresIn: data.expires_in || 5184000,
        tokenType: data.token_type || 'Bearer',
      };
    } catch (err: any) {
      console.warn(
        `[InstagramService] Token refresh failed: ${err.message}. Returning existing token.`,
      );
      return {
        accessToken: refreshToken,
        refreshToken,
        expiresIn: 3600,
      };
    }
  }

  /**
   * Fetches Instagram profile details including account_type for eligibility verification.
   */
  async fetchProfile(accessToken: string): Promise<PlatformProfile> {
    try {
      const url = `https://graph.instagram.com/v18.0/me?fields=id,username,name,profile_picture_url,followers_count,account_type&access_token=${accessToken}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message || 'Failed to fetch connected Instagram profile',
        );
      }

      const rawAccountType = (data.account_type || '').toUpperCase();
      const isProfessional =
        rawAccountType === 'BUSINESS' || rawAccountType === 'MEDIA_CREATOR';

      return {
        platformUserId: data.id,
        name: data.name || data.username || 'Instagram Account',
        avatar: data.profile_picture_url,
        metadata: {
          username: data.username,
          followers: data.followers_count || 0,
          accountType: rawAccountType || 'UNKNOWN',
          isLiveEligible: isProfessional,
          eligibilityReason: isProfessional
            ? 'Account is an Instagram Professional Account (eligible for Live Producer).'
            : 'Personal Instagram accounts cannot broadcast via Live Producer. Convert to a Professional (Creator or Business) account on Instagram.',
          streamingMode: 'LIVE_PRODUCER',
        },
      };
    } catch (err: any) {
      throw new Error(`Instagram profile fetch failed: ${err.message}`);
    }
  }

  /**
   * Evaluates Instagram account streaming eligibility.
   */
  checkEligibility(accountMetadata?: Record<string, any>): InstagramEligibilityResult {
    const accountType = (accountMetadata?.accountType || '').toUpperCase();
    if (accountType === 'BUSINESS' || accountType === 'MEDIA_CREATOR') {
      return {
        isEligible: true,
        accountType: accountType as 'BUSINESS' | 'MEDIA_CREATOR',
      };
    }

    if (accountType === 'PERSONAL') {
      return {
        isEligible: false,
        accountType: 'PERSONAL',
        reason: 'Personal Instagram accounts do not have access to Instagram Live Producer.',
        requiredAction:
          'Switch your account to a Professional (Creator or Business) account in the Instagram mobile app settings under "Account type and tools".',
      };
    }

    return {
      isEligible: true, // Default optimistic for Live Producer if account type is unspecified
      accountType: 'UNKNOWN',
    };
  }
}
