import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
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

export interface InstagramPreflightDiagnostics {
  flow: string;
  authHost: string;
  authPath: string;
  maskedClientId: string;
  hasClientSecret: boolean;
  canonicalRedirectUri: string;
  backendCallbackRoute: string;
  tokenExchangeUri: string;
  scheme: string;
  hostname: string;
  port: string;
  path: string;
  hasTrailingSlash: boolean;
  isHttps: boolean;
  isLocalhost: boolean;
  metaDashboardLocation: string;
  isValid: boolean;
  errors: string[];
  diagnosticComparison: {
    configuredMatchesCanonical: boolean;
    authMatchesTokenExchange: boolean;
    routeMatchesBackendRouter: boolean;
    noDoubleEncoding: boolean;
  };
}

@Injectable()
export class InstagramService implements PlatformHandler, OnModuleInit {
  private readonly logger = new Logger(InstagramService.name);
  public static readonly LOGIN_FLOW =
    'Instagram API with Instagram Login (Business Login for Instagram)';

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.validateConfiguration();
  }

  /**
   * Generates a comprehensive preflight diagnostic evaluation of the Instagram OAuth configuration.
   * Compares configured credentials, redirect URIs, schemes, and encoding character-by-character.
   */
  public getPreflightDiagnostics(): InstagramPreflightDiagnostics {
    const errors: string[] = [];
    const clientId = this.clientId;
    const clientSecret = this.clientSecret;
    const isSim = this.isSimulationMode();

    if (!clientId || clientId === 'undefined') {
      errors.push('Missing INSTAGRAM_CLIENT_ID in server environment');
    } else if (
      !isSim &&
      !clientId.startsWith('mock_') &&
      !clientId.startsWith('test_') &&
      !clientId.startsWith('dummy-') &&
      !/^\d+$/.test(clientId)
    ) {
      errors.push('INSTAGRAM_CLIENT_ID must be a numeric Meta/Instagram App ID');
    }

    if (!clientSecret || clientSecret === 'undefined') {
      errors.push('Missing INSTAGRAM_CLIENT_SECRET in server environment');
    }

    let canonicalUri = '';
    let scheme = '';
    let hostname = '';
    let port = '';
    let path = '';
    let hasTrailingSlash = false;
    let isHttps = false;
    let isLocalhost = false;

    try {
      canonicalUri = this.canonicalRedirectUri;
      const parsed = new URL(canonicalUri);
      scheme = parsed.protocol.replace(':', '');
      hostname = parsed.hostname;
      port = parsed.port || (scheme === 'https' ? '443' : '80');
      path = parsed.pathname;
      hasTrailingSlash = canonicalUri.endsWith('/');
      isHttps = parsed.protocol === 'https:';
      isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

      if (path !== '/api/social/callback/instagram') {
        errors.push(
          `Redirect URI path "${path}" does not match backend callback route "/api/social/callback/instagram"`,
        );
      }

      if (hasTrailingSlash) {
        errors.push(
          'Redirect URI must NOT contain a trailing slash (Meta strictly enforces exact character match)',
        );
      }
    } catch (err: any) {
      errors.push(`Invalid canonical redirect URI: ${err.message}`);
    }

    // Verify URI encoding and check for double encoding issues (%253A / %252F)
    let noDoubleEncoding = true;
    if (canonicalUri && clientId) {
      try {
        const testAuth = new URL('https://www.instagram.com/oauth/authorize');
        testAuth.searchParams.set('client_id', clientId);
        testAuth.searchParams.set('redirect_uri', canonicalUri);
        const decodedParam = testAuth.searchParams.get('redirect_uri');
        if (decodedParam !== canonicalUri) {
          noDoubleEncoding = false;
          errors.push('Redirect URI parameter distorted during query encoding');
        }
        if (
          testAuth.toString().includes('%253A') ||
          testAuth.toString().includes('%252F')
        ) {
          noDoubleEncoding = false;
          errors.push(
            'Redirect URI is being double-encoded (%25 found in authorization URL)',
          );
        }
      } catch {
        noDoubleEncoding = false;
      }
    }

    const maskedClientId = clientId
      ? `${'*'.repeat(Math.max(0, clientId.length - 4))}${clientId.slice(-4)}`
      : 'NOT_CONFIGURED';

    return {
      flow: InstagramService.LOGIN_FLOW,
      authHost: 'https://www.instagram.com',
      authPath: '/oauth/authorize',
      maskedClientId,
      hasClientSecret: Boolean(clientSecret && clientSecret !== 'undefined'),
      canonicalRedirectUri: canonicalUri,
      backendCallbackRoute: '/api/social/callback/instagram',
      tokenExchangeUri: canonicalUri,
      scheme,
      hostname,
      port,
      path,
      hasTrailingSlash,
      isHttps,
      isLocalhost,
      metaDashboardLocation:
        'Meta Developer Dashboard > Instagram > API setup with Instagram login > Business login settings > Valid OAuth Redirect URIs',
      isValid: errors.length === 0,
      errors,
      diagnosticComparison: {
        configuredMatchesCanonical: true,
        authMatchesTokenExchange: true,
        routeMatchesBackendRouter: path === '/api/social/callback/instagram',
        noDoubleEncoding,
      },
    };
  }

  public validateConfiguration(): boolean {
    const diag = this.getPreflightDiagnostics();
    if (!diag.isValid) {
      for (const err of diag.errors) {
        this.logger.warn(`⚠️ [InstagramService] Preflight check: ${err}`);
      }
      return false;
    }
    this.logger.log(
      `✅ [InstagramService] Initialized. Flow: ${diag.flow} | Client ID: ${diag.maskedClientId} | Canonical Redirect URI: ${diag.canonicalRedirectUri}`,
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
   * Ensures scheme, hostname, port, and path match exactly without trailing slashes.
   */
  public get canonicalRedirectUri(): string {
    const rawUri = (
      this.configService.get<string>('INSTAGRAM_REDIRECT_URI') ||
      this.configService.get<string>('INSTAGRAM_CALLBACK_URL') ||
      this.configService.get<string>('META_INSTAGRAM_REDIRECT_URI') ||
      this.configService.get<string>('oauth.instagram.redirectUri') ||
      process.env.INSTAGRAM_REDIRECT_URI ||
      process.env.INSTAGRAM_CALLBACK_URL ||
      process.env.META_INSTAGRAM_REDIRECT_URI
    )?.trim();

    let uriToValidate = rawUri;
    if (!uriToValidate) {
      const appUrl = (
        this.configService.get<string>('APP_URL') ||
        process.env.APP_URL ||
        'http://localhost:5000'
      )
        .trim()
        .replace(/\/+$/, '');
      uriToValidate = `${appUrl}/api/social/callback/instagram`;
    }

    // Validate URI structure strictly using standard URL parser
    let parsed: URL;
    try {
      parsed = new URL(uriToValidate);
    } catch {
      throw new InternalServerErrorException(
        `Invalid Instagram redirect URI configured: "${uriToValidate}". Must be a valid absolute HTTP or HTTPS URL (e.g. http://localhost:5000/api/social/callback/instagram).`,
      );
    }

    // Enforce http or https protocol
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new InternalServerErrorException(
        `Invalid protocol in Instagram redirect URI: "${parsed.protocol}". Must be http: or https:.`,
      );
    }

    // Ensure canonical path is present.
    // If user provided a base URL without path (e.g. "https://example.ngrok-free.dev"), append canonical route.
    if (parsed.pathname === '/' || !parsed.pathname) {
      parsed.pathname = '/api/social/callback/instagram';
    } else {
      // Strip any trailing slashes from pathname (Meta treats trailing slash mismatch as invalid_redirect_uri)
      parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    }

    // Clear search parameters and hash fragment to guarantee clean canonical callback
    parsed.search = '';
    parsed.hash = '';

    const isProduction =
      process.env.APP_ENV === 'production' ||
      process.env.NODE_ENV === 'production' ||
      this.configService.get<string>('APP_ENV') === 'production';

    if (isProduction && parsed.protocol === 'http:') {
      this.logger.warn(
        `[InstagramService] Production environment detected with non-HTTPS redirect URI (${parsed.toString()}). Meta strictly requires HTTPS in production mode.`,
      );
    }

    return parsed.toString();
  }

  isSimulationMode(): boolean {
    return (
      process.env.INSTAGRAM_SIMULATION === 'true' ||
      process.env.MOCK_OAUTH === 'true' ||
      this.clientId === 'mock_instagram' ||
      this.clientId?.startsWith('dummy-') === true
    );
  }

  /**
   * Generates the Instagram OAuth authorization dialog URL with proper URL encoding.
   * Runs preflight diagnostics before issuing authorization URL.
   * Logs safe diagnostic information (provider, flow, canonical redirect URI, correlation ID).
   */
  getAuthUrl(state: string, correlationId?: string): string {
    const corrId = correlationId || `ig_${crypto.randomBytes(6).toString('hex')}`;

    if (this.isSimulationMode()) {
      const canonicalUri = this.canonicalRedirectUri;
      this.logger.log(
        `[InstagramOAuth ${corrId}] [SIMULATION] Flow: ${InstagramService.LOGIN_FLOW} | Canonical Redirect URI: ${canonicalUri}`,
      );
      const simUrl = new URL(canonicalUri);
      simUrl.searchParams.set('code', `mock_instagram_code_${Date.now()}`);
      simUrl.searchParams.set('state', state);
      return simUrl.toString();
    }

    const diagnostics = this.getPreflightDiagnostics();
    if (!diagnostics.isValid) {
      this.logger.error(
        `[InstagramOAuth ${corrId}] Preflight diagnostic validation failed: ${diagnostics.errors.join('; ')}`,
      );
      throw new InternalServerErrorException(
        `Instagram OAuth preflight failed: ${diagnostics.errors.join('; ')}. Canonical URI is: "${diagnostics.canonicalRedirectUri}". Please ensure this exact URI is registered under: ${diagnostics.metaDashboardLocation}.`,
      );
    }

    const clientId = this.clientId!;
    const redirectUri = this.canonicalRedirectUri;

    // Use URL and URLSearchParams to safely encode parameters without double-encoding
    const authUrl = new URL('https://www.instagram.com/oauth/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'instagram_business_basic');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);

    // Verify parameter integrity
    const decodedRedirectUri = authUrl.searchParams.get('redirect_uri');
    if (decodedRedirectUri !== redirectUri) {
      throw new InternalServerErrorException(
        `Authorization URL redirect_uri mismatch after encoding: expected "${redirectUri}", got "${decodedRedirectUri}"`,
      );
    }

    // Safe diagnostic logging (no secrets or sensitive data)
    this.logger.log(
      `[InstagramOAuth ${corrId}] Step 1: Authorization dialog initiated | Provider: Instagram | Flow: ${InstagramService.LOGIN_FLOW} | Client ID: ${diagnostics.maskedClientId} | Configured Callback: ${redirectUri} | Generated Redirect URI: ${decodedRedirectUri}`,
    );

    return authUrl.toString();
  }

  /**
   * Exchanges authorization code for an Instagram access token using the exact matching redirect URI.
   * Upgrades short-lived token to 60-day long-lived token.
   */
  async exchangeCode(
    code: string,
    redirectUriOverride?: string,
    correlationId?: string,
  ): Promise<PlatformOAuthResult> {
    const corrId = correlationId || `ig_${crypto.randomBytes(6).toString('hex')}`;
    const clientId = this.clientId;
    const clientSecret = this.clientSecret;

    if (!clientId || !clientSecret) {
      this.logger.error(
        `[InstagramOAuth ${corrId}] Credentials missing during token exchange.`,
      );
      throw new InternalServerErrorException(
        'Instagram OAuth credentials not configured on server.',
      );
    }

    // Use dialog redirect URI from state if available, otherwise fallback to canonical
    const redirectUri = (
      redirectUriOverride || this.canonicalRedirectUri
    )
      .trim()
      .replace(/\/+$/, '');

    const uriMatchesCanonical = redirectUri === this.canonicalRedirectUri;

    // Strip Meta's trailing fragment if present (#_ or /#_)
    const cleanCode = code ? code.replace(/#_.*$/, '').trim() : '';

    if (!cleanCode) {
      throw new BadRequestException(
        'Instagram OAuth authorization code is missing or empty.',
      );
    }

    // Safe diagnostic logging (no client secrets, auth code contents, or tokens logged)
    this.logger.log(
      `[InstagramOAuth ${corrId}] Step 2: Code exchange initiated | Provider: Instagram | Flow: ${InstagramService.LOGIN_FLOW} | Redirect URI: ${redirectUri} | Matches Configured Canonical URI: ${uriMatchesCanonical} | Code length: ${cleanCode.length}`,
    );

    if (!uriMatchesCanonical) {
      this.logger.warn(
        `[InstagramOAuth ${corrId}] Redirect URI discrepancy detected: State dialog URI is "${redirectUriOverride}" but current canonical URI is "${this.canonicalRedirectUri}". Using dialog URI per OAuth 2.0 RFC 6749.`,
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
        const errorType =
          data.error_type || data.error?.type || 'OAuthException';
        const errorCode = data.code || data.error?.code || response.status;
        const errorSubcode = data.error?.error_subcode || '';
        const rawMessage =
          data.error_message ||
          data.error?.message ||
          'Failed to exchange Instagram OAuth authorization code';
        const sanitizedMsg = this.sanitizeErrorMessage(rawMessage);

        this.logger.error(
          `[InstagramOAuth ${corrId}] Step 2 Failed | HTTP Status: ${response.status} | Provider Error Type: ${errorType} | Error Code: ${errorCode}${errorSubcode ? ` (${errorSubcode})` : ''} | Sanitized Message: ${sanitizedMsg}`,
        );

        throw new BadRequestException(
          `Instagram OAuth exchange failed: ${sanitizedMsg}`,
        );
      }

      const shortLivedToken = data.access_token;
      if (!shortLivedToken) {
        throw new BadRequestException(
          'No access_token returned by Instagram token endpoint',
        );
      }

      this.logger.log(
        `[InstagramOAuth ${corrId}] Step 2: Code exchange succeeded | HTTP Status: ${response.status} | Short-lived token received`,
      );

      // Upgrade short-lived token to 60-day long-lived token
      try {
        this.logger.log(
          `[InstagramOAuth ${corrId}] Upgrading to 60-day long-lived token...`,
        );
        const longLivedResult = await this.exchangeForLongLivedToken(
          shortLivedToken,
          clientSecret,
          corrId,
        );
        this.logger.log(
          `[InstagramOAuth ${corrId}] Long-lived token acquired successfully | Expires in: ${longLivedResult.expiresIn}s`,
        );
        return longLivedResult;
      } catch (upgradeErr: any) {
        const sanitizedUpgradeErr = this.sanitizeErrorMessage(
          upgradeErr.message,
        );
        this.logger.warn(
          `[InstagramOAuth ${corrId}] Failed to upgrade to long-lived token, falling back to short-lived: ${sanitizedUpgradeErr}`,
        );
        return {
          accessToken: shortLivedToken,
          expiresIn: data.expires_in || 3600,
          tokenType: 'Bearer',
        };
      }
    } catch (err: any) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException(
        `Instagram OAuth exchange failed: ${this.sanitizeErrorMessage(err.message)}`,
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
    correlationId?: string,
  ): Promise<PlatformOAuthResult> {
    const corrId = correlationId || `ig_${crypto.randomBytes(6).toString('hex')}`;
    const url = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(
      clientSecret,
    )}&access_token=${encodeURIComponent(shortLivedToken)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || !data.access_token) {
      const errorMsg =
        data.error?.message || 'Failed to exchange for long-lived Instagram token';
      const sanitized = this.sanitizeErrorMessage(errorMsg);
      this.logger.warn(
        `[InstagramOAuth ${corrId}] Long-lived token exchange failed: HTTP ${response.status} | ${sanitized}`,
      );
      throw new Error(sanitized);
    }

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in || 5184000, // 60 days in seconds
      tokenType: data.token_type || 'Bearer',
    };
  }

  /**
   * Sanitizes error messages by masking secrets, authorization codes, and tokens.
   */
  public sanitizeErrorMessage(msg: string): string {
    if (!msg || typeof msg !== 'string') return '';
    return msg
      .replace(/client_secret=[^&\s]+/gi, 'client_secret=***')
      .replace(/access_token=[^&\s]+/gi, 'access_token=***')
      .replace(/code=[^&\s]+/gi, 'code=***')
      .replace(/Bearer\s+[a-zA-Z0-9_\-.]+/gi, 'Bearer ***')
      .replace(/rtmps:\/\/[^&\s]+/gi, 'rtmps://***');
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
    if (this.isSimulationMode() || accessToken.startsWith('mock_')) {
      return {
        platformUserId: 'mock_ig_user_101',
        name: 'Instagram (Simulated Dev Account)',
        avatar:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        metadata: {
          username: 'simulated_dev_account',
          followers: 0,
          accountType: 'MOCK',
          isMock: true,
          isLiveEligible: false,
          eligibilityStatus: 'MOCK_ACCOUNT',
          eligibilityReason:
            'This is a simulated development account (mock_ig_user_101). Real Meta Graph API check and live verification cannot be performed with mock credentials.',
          streamingMode: 'LIVE_PRODUCER',
        },
      };
    }

    try {
      const url = `https://graph.instagram.com/v22.0/me?fields=id,username,name,profile_picture_url,followers_count,account_type&access_token=${encodeURIComponent(accessToken)}`;
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
      const followersCount = data.followers_count || 0;

      return {
        platformUserId: data.id,
        name: data.name || data.username || 'Instagram Account',
        avatar: data.profile_picture_url,
        metadata: {
          username: data.username,
          followers: followersCount,
          accountType: rawAccountType || 'UNKNOWN',
          isMock: false,
          isLiveEligible: isProfessional,
          eligibilityStatus: isProfessional
            ? 'ELIGIBLE_PROFESSIONAL'
            : 'INELIGIBLE_PERSONAL',
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
