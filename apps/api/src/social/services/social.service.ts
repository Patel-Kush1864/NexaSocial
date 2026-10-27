/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import {
  ConnectedAccount,
  AccountStatus,
} from '../entities/connected-account.entity';
import {
  SocialAccount,
  SocialAccountStatus,
} from '../entities/social-account.entity';
import { OAuthToken } from '../entities/oauth-token.entity';
import { Platform } from '../../database/entities/platform.entity';
import { ActivityLog } from '../../users/entities/activity-log.entity';
import { WorkspaceMember } from '../../workspace-members/entities/workspace-member.entity';
import { UsageLimitService } from '../../subscriptions/services/usage-limit.service';
import { LoggerServiceWrapper } from '../../logger/logger.service';
import { encrypt, decrypt } from '../utils/crypto.helper';
import { PlatformHandler } from '../interfaces/platform-handler.interface';
import { YoutubeService } from '../platforms/youtube/youtube.service';
import { FacebookService } from '../platforms/facebook/facebook.service';
import { InstagramService } from '../platforms/instagram/instagram.service';

import { LinkedinService } from '../platforms/linkedin/linkedin.service';
import { TwitterService } from '../platforms/twitter/twitter.service';
import { TwitchService } from '../platforms/twitch/twitch.service';
import { TiktokService } from '../platforms/tiktok/tiktok.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import { SocialAnalyticsSnapshot } from '../../dashboard/entities/social-analytics-snapshot.entity';
import {
  extractAccountFollowers,
  extractAccountInteractions,
  normalizePlatformName,
} from '../../dashboard/helpers/metric-extractor.helper';

@Injectable()
export class SocialService {
  constructor(
    @InjectRepository(ConnectedAccount)
    private readonly accountRepository: Repository<ConnectedAccount>,
    @InjectRepository(SocialAccount)
    private readonly socialAccountRepository: Repository<SocialAccount>,
    @InjectRepository(OAuthToken)
    private readonly tokenRepository: Repository<OAuthToken>,
    @InjectRepository(Platform)
    private readonly platformRepository: Repository<Platform>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
    @InjectRepository(SocialAnalyticsSnapshot)
    private readonly snapshotRepository: Repository<SocialAnalyticsSnapshot>,
    private readonly usageLimitService: UsageLimitService,
    private readonly loggerService: LoggerServiceWrapper,
    private readonly eventEmitter: EventEmitter2,

    // Inject Platform Services
    private readonly youtubeService: YoutubeService,
    private readonly facebookService: FacebookService,
    private readonly instagramService: InstagramService,

    private readonly linkedinService: LinkedinService,
    private readonly twitterService: TwitterService,
    private readonly twitchService: TwitchService,
    private readonly tiktokService: TiktokService,
  ) {}

  private async recordSnapshot(account: ConnectedAccount): Promise<void> {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const followers = extractAccountFollowers(
        account.platformName,
        account.metadata,
      );
      const interactions = extractAccountInteractions(
        account.platformName,
        account.metadata,
      );
      const normPlatform = normalizePlatformName(account.platformName);

      const existing = await this.snapshotRepository.findOne({
        where: { connectedAccountId: account.id, snapshotDate: todayStr },
      });

      if (!existing) {
        await this.snapshotRepository.save(
          this.snapshotRepository.create({
            workspaceId: account.workspaceId,
            connectedAccountId: account.id,
            platformName: normPlatform,
            followers: followers ?? 0,
            engagement: interactions ?? 0,
            snapshotDate: todayStr,
          }),
        );
      } else {
        if (followers !== null) existing.followers = followers;
        if (interactions !== null) existing.engagement = interactions;
        await this.snapshotRepository.save(existing);
      }
    } catch (err: any) {
      this.loggerService.warn(
        `Failed to record analytics snapshot: ${err?.message || err}`,
        'SocialService',
      );
    }
  }

  private getPlatformHandler(platform: string): PlatformHandler {
    const p = platform.toUpperCase();
    if (p === 'YOUTUBE') return this.youtubeService;
    if (p === 'FACEBOOK') return this.facebookService;
    if (p === 'INSTAGRAM') return this.instagramService;
    if (p === 'TWITTER' || p === 'X') return this.twitterService;
    throw new BadRequestException(`Unsupported social platform: ${platform}`);
  }

  async getPlatforms(): Promise<any[]> {
    const platforms = await this.platformRepository.find({
      order: { name: 'ASC' },
    });
    return platforms.map((p) => {
      const canonical =
        p.name.toUpperCase() === 'TWITTER' ? 'X' : p.name.toUpperCase();
      return {
        id: canonical,
        platformId: p.id,
        name: p.name,
        isEnabled: Boolean(p.isActive),
        isActive: Boolean(p.isActive),
        icon: canonical.toLowerCase(),
      };
    });
  }

  async connect(
    platform: string,
    workspaceId: string,
    userId: string,
  ): Promise<{ url: string }> {
    // Check subscription limit first
    const allowed = await this.usageLimitService.canConnectAccount(
      userId,
      workspaceId,
    );
    if (!allowed) {
      throw new BadRequestException(
        'Your workspace has reached the limit for this feature. Please contact the workspace owner to manage the plan.',
      );
    }

    const p = platform.toUpperCase();
    const platformNameMap: Record<string, string> = {
      YOUTUBE: 'YouTube',
      FACEBOOK: 'Facebook',
      INSTAGRAM: 'Instagram',
      TWITTER: 'X',
      X: 'X',
    };

    const dbName = platformNameMap[p];
    if (dbName) {
      const platformRecord = await this.platformRepository.findOne({
        where: { name: dbName },
      });
      if (platformRecord && !platformRecord.isActive) {
        throw new BadRequestException(
          'This social platform is currently unavailable.',
        );
      }
    }

    const handler = this.getPlatformHandler(platform);
    if (p === 'INSTAGRAM') {
      const diag = this.instagramService.getPreflightDiagnostics();
      if (!diag.isValid) {
        throw new BadRequestException(
          `Instagram OAuth preflight check failed: ${diag.errors.join('; ')}`,
        );
      }
    }
    if (
      p === 'YOUTUBE' &&
      typeof this.youtubeService.getPreflightDiagnostics === 'function'
    ) {
      const diag = this.youtubeService.getPreflightDiagnostics();
      if (!diag.isValid) {
        throw new BadRequestException(
          `YouTube OAuth preflight check failed: ${diag.errors.join('; ')}`,
        );
      }
    }

    // Retrieve canonical redirect URI from handler if supported
    const redirectUri = (handler as any).canonicalRedirectUri || undefined;
    const correlationId = `oauth_${platform.toLowerCase()}_${crypto.randomBytes(6).toString('hex')}`;
    const nonce = crypto.randomBytes(16).toString('hex');

    // Encode state parameters securely
    const stateObj = {
      workspaceId,
      platform: platform.toUpperCase(),
      userId,
      redirectUri,
      correlationId,
      nonce,
      timestamp: Date.now(),
    };
    const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');

    this.loggerService.log(
      `[OAuth Initiation ${correlationId}] Platform: ${platform} | Workspace: ${workspaceId} | User: ${userId} | Canonical Redirect URI: ${redirectUri || 'default'}`,
      'SocialService',
    );

    return { url: handler.getAuthUrl(state, correlationId) };
  }

  getPreflightDiagnostics(platform: string) {
    const p = platform.toUpperCase();
    if (p === 'INSTAGRAM') {
      return this.instagramService.getPreflightDiagnostics();
    }
    if (p === 'YOUTUBE') {
      return this.youtubeService.getPreflightDiagnostics();
    }
    const handler = this.getPlatformHandler(platform);
    const redirectUri = (handler as any).canonicalRedirectUri || undefined;
    return {
      platform: p,
      supported: true,
      canonicalRedirectUri: redirectUri,
      isValid: true,
      errors: [],
    };
  }

  /**
   * Tracks consumed authorization code hashes to prevent duplicate/replay token exchanges.
   * Codes expire naturally from memory after 15 minutes.
   */
  private readonly consumedAuthCodes = new Map<string, number>();

  private markCodeConsumed(codeHash: string): void {
    const now = Date.now();
    this.consumedAuthCodes.set(codeHash, now);

    // Evict entries older than 15 minutes if cache grows
    if (this.consumedAuthCodes.size > 200) {
      for (const [hash, time] of this.consumedAuthCodes.entries()) {
        if (now - time > 15 * 60 * 1000) {
          this.consumedAuthCodes.delete(hash);
        }
      }
    }
  }

  async handleCallback(
    platform: string,
    code: string,
    stateStr: string,
  ): Promise<ConnectedAccount> {
    if (!code || typeof code !== 'string') {
      throw new BadRequestException('Missing authorization code');
    }
    if (!stateStr || typeof stateStr !== 'string') {
      throw new BadRequestException('Missing OAuth state parameter');
    }

    let decoded: any;
    try {
      decoded = JSON.parse(
        Buffer.from(stateStr, 'base64').toString('utf8'),
      );
    } catch {
      throw new BadRequestException(
        'OAuth state validation parameter is invalid',
      );
    }

    const {
      workspaceId,
      userId,
      platform: statePlatform,
      redirectUri: stateRedirectUri,
      correlationId: stateCorrelationId,
      timestamp,
    } = decoded;

    const correlationId =
      stateCorrelationId || `oauth_cb_${crypto.randomBytes(6).toString('hex')}`;

    if (!workspaceId || !userId) {
      throw new BadRequestException(
        'OAuth state missing required workspace or user identifiers',
      );
    }

    if (
      statePlatform &&
      statePlatform.toUpperCase() !== platform.toUpperCase()
    ) {
      throw new BadRequestException(
        `OAuth state platform mismatch: expected ${platform.toUpperCase()}, got ${statePlatform}`,
      );
    }

    // Reject expired state (> 15 minutes)
    if (timestamp && Date.now() - timestamp > 15 * 60 * 1000) {
      throw new BadRequestException(
        'OAuth state parameter has expired. Please initiate the connection again.',
      );
    }

    this.loggerService.log(
      `[OAuth Callback ${correlationId}] State validation succeeded for platform ${platform} | Workspace: ${workspaceId} | User: ${userId}`,
      'SocialService',
    );

    // Replay attack and duplicate code prevention:
    // Meta authorization codes are single-use and expire within seconds/minutes.
    const cleanCode = code.replace(/#_.*$/, '').trim();
    if (!cleanCode) {
      throw new BadRequestException('Authorization code is empty after sanitization');
    }

    const codeHash = crypto
      .createHash('sha256')
      .update(cleanCode)
      .digest('hex');

    if (this.consumedAuthCodes.has(codeHash)) {
      throw new BadRequestException(
        'OAuth authorization code has already been consumed or processed. Please start a new connection.',
      );
    }
    this.markCodeConsumed(codeHash);

    const handler = this.getPlatformHandler(platform);
    const oauthResult = await handler.exchangeCode(
      cleanCode,
      stateRedirectUri,
      correlationId,
    );
    const profile = await handler.fetchProfile(oauthResult.accessToken);

    // Check if account already exists in this workspace
    let account = await this.accountRepository.findOne({
      where: {
        workspaceId,
        platformName: platform.toUpperCase(),
        platformUserId: profile.platformUserId,
      },
    });

    if (account) {
      // Re-connect flow: update name, status, and token
      account.name = profile.name;
      account.avatar = profile.avatar || account.avatar;
      account.status = AccountStatus.CONNECTED;
      account.metadata = profile.metadata || account.metadata;
      await this.accountRepository.save(account);

      let tokenRecord = await this.tokenRepository.findOne({
        where: { connectedAccountId: account.id },
      });
      if (!tokenRecord) {
        tokenRecord = this.tokenRepository.create({
          connectedAccountId: account.id,
        });
      }
      tokenRecord.accessToken = encrypt(oauthResult.accessToken);
      tokenRecord.refreshToken = oauthResult.refreshToken
        ? encrypt(oauthResult.refreshToken)
        : tokenRecord.refreshToken;
      tokenRecord.expiresAt = oauthResult.expiresIn
        ? new Date(Date.now() + oauthResult.expiresIn * 1000)
        : tokenRecord.expiresAt;
      tokenRecord.scope = oauthResult.scope || tokenRecord.scope;
      tokenRecord.tokenType = oauthResult.tokenType || tokenRecord.tokenType;
      await this.tokenRepository.save(tokenRecord);
    } else {
      // Create new account
      account = this.accountRepository.create({
        workspaceId,
        platformName: platform.toUpperCase(),
        platformUserId: profile.platformUserId,
        name: profile.name,
        avatar: profile.avatar,
        status: AccountStatus.CONNECTED,
        metadata: profile.metadata,
      });
      await this.accountRepository.save(account);

      const tokenRecord = this.tokenRepository.create({
        connectedAccountId: account.id,
        accessToken: encrypt(oauthResult.accessToken),
        refreshToken: oauthResult.refreshToken
          ? encrypt(oauthResult.refreshToken)
          : undefined,
        expiresAt: oauthResult.expiresIn
          ? new Date(Date.now() + oauthResult.expiresIn * 1000)
          : undefined,
        scope: oauthResult.scope,
        tokenType: oauthResult.tokenType,
      });
      await this.tokenRepository.save(tokenRecord);
    }

    await this.recordSnapshot(account);

    this.loggerService.log(
      `Social account connected: ${profile.name} (${platform.toUpperCase()}) in Workspace ${workspaceId}`,
      'SocialService',
      'security',
    );

    // Save Activity Log
    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId,
        action: 'PLATFORM_CONNECTED',
        metadata: {
          workspaceId,
          platformName: platform.toUpperCase(),
          accountName: profile.name,
        },
      }),
    );

    // Emit event for automated email dispatch
    this.eventEmitter.emit('social.connected', {
      userId,
      platform: platform.toUpperCase(),
      accountName: profile.name,
      workspaceId,
    });

    return account;
  }

  async getConnectedAccounts(
    workspaceId?: string,
    userId?: string,
    userRole?: string,
  ): Promise<ConnectedAccount[]> {
    console.log(
      `[SocialService] getConnectedAccounts called. workspaceId: ${workspaceId}, userId: ${userId}, userRole: ${userRole}`,
    );

    const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

    if (isAdmin && workspaceId) {
      const accounts = await this.accountRepository.find({
        where: { workspaceId },
        order: { created_at: 'DESC' },
      });
      console.log(
        `[SocialService] Admin access: found ${accounts.length} accounts for workspace: ${workspaceId}`,
      );
      return accounts;
    }

    let userWorkspaceIds: string[] = [];

    if (userId) {
      const memberships = await this.memberRepository.find({
        where: { userId },
        select: ['workspaceId'],
      });
      userWorkspaceIds = memberships.map((m) => m.workspaceId);
      console.log(`[SocialService] Found userWorkspaceIds:`, userWorkspaceIds);

      if (userWorkspaceIds.length === 0 && !isAdmin) {
        console.warn(`[SocialService] No workspace memberships found for user: ${userId}`);
        return [];
      }
    }

    if (workspaceId) {
      if (
        userWorkspaceIds.length > 0 &&
        !userWorkspaceIds.includes(workspaceId) &&
        !isAdmin
      ) {
        console.warn(
          `[SocialService] Workspace ${workspaceId} not in user workspace list ${JSON.stringify(userWorkspaceIds)}`,
        );
        return [];
      }
      const accounts = await this.accountRepository.find({
        where: { workspaceId },
        order: { created_at: 'DESC' },
      });
      console.log(
        `[SocialService] Returning ${accounts.length} accounts for workspace: ${workspaceId}`,
      );
      return accounts;
    }

    if (userWorkspaceIds.length > 0) {
      const accounts = await this.accountRepository.find({
        where: { workspaceId: In(userWorkspaceIds) },
        order: { created_at: 'DESC' },
      });
      console.log(
        `[SocialService] Returning ${accounts.length} accounts across workspaces:`,
        userWorkspaceIds,
      );
      return accounts;
    }

    return [];
  }

  async getAccountDetails(
    accountId: string,
    workspaceId: string,
  ): Promise<ConnectedAccount> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, workspaceId },
    });
    if (!account) {
      throw new NotFoundException('Connected social account not found');
    }
    return account;
  }

  async disconnect(
    accountId: string,
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    let account = workspaceId
      ? await this.accountRepository.findOne({
          where: { id: accountId, workspaceId },
        })
      : null;

    if (!account) {
      account = await this.accountRepository.findOne({
        where: { id: accountId },
      });
    }

    // Also look for matching record in SocialAccount (Facebook integration)
    let socialAcc = await this.socialAccountRepository.findOne({
      where: { id: accountId },
    });

    if (!socialAcc && account?.platformUserId) {
      socialAcc = await this.socialAccountRepository.findOne({
        where: [
          { pageId: account.platformUserId },
          { providerUserId: account.platformUserId },
        ],
      });
    }

    if (!account && !socialAcc) {
      socialAcc = await this.socialAccountRepository.findOne({
        where: [
          { pageId: accountId },
          { providerUserId: accountId },
        ],
      });
    }

    if (!account && !socialAcc) {
      throw new NotFoundException('Connected social account not found');
    }

    const accountName =
      account?.name ||
      socialAcc?.pageName ||
      socialAcc?.providerName ||
      'Social Account';
    const platform =
      account?.platformName ||
      socialAcc?.provider?.toUpperCase() ||
      'UNKNOWN';

    // 1. Delete from connected_accounts
    if (account) {
      await this.accountRepository.remove(account);
      await this.tokenRepository.delete({ connectedAccountId: account.id });
    }

    // 2. Delete from social_accounts and any corresponding connected_accounts
    if (socialAcc) {
      await this.socialAccountRepository.remove(socialAcc);
      await this.tokenRepository.delete({ connectedAccountId: socialAcc.id });

      // Clean up any remaining connected_accounts linked to this Facebook page/profile
      const remainingConnected = await this.accountRepository.find({
        where: [
          { id: socialAcc.id },
          ...(socialAcc.pageId ? [{ platformUserId: socialAcc.pageId }] : []),
          ...(socialAcc.providerUserId
            ? [{ platformUserId: socialAcc.providerUserId }]
            : []),
        ],
      });
      for (const conn of remainingConnected) {
        await this.accountRepository.remove(conn);
        await this.tokenRepository.delete({ connectedAccountId: conn.id });
      }
    }

    this.loggerService.log(
      `Social account disconnected: ${accountName} (${platform}) from Workspace ${workspaceId} by User ${userId}`,
      'SocialService',
      'security',
    );

    // Log Activity
    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId,
        action: 'PLATFORM_DISCONNECTED',
        metadata: { workspaceId, platformName: platform, accountName },
      }),
    );

    // Emit event for automated email dispatch
    this.eventEmitter.emit('social.disconnected', {
      userId,
      platform,
      accountName,
      workspaceId,
    });
  }

  async syncAccount(
    accountId: string,
    workspaceId: string,
    userId: string,
  ): Promise<ConnectedAccount> {
    let account = workspaceId
      ? await this.accountRepository.findOne({
          where: { id: accountId, workspaceId },
        })
      : null;

    if (!account) {
      account = await this.accountRepository.findOne({
        where: { id: accountId },
      });
    }

    if (!account) {
      throw new NotFoundException('Connected social account not found');
    }

    const token = await this.tokenRepository.findOne({
      where: { connectedAccountId: accountId },
    });
    if (!token) {
      throw new BadRequestException(
        'OAuth tokens missing. Please reconnect your account.',
      );
    }

    let decryptedAccessToken = token.accessToken;
    if (token.accessToken && token.accessToken.includes(':')) {
      try {
        decryptedAccessToken = decrypt(token.accessToken);
      } catch {
        decryptedAccessToken = token.accessToken;
      }
    }

    const handler = this.getPlatformHandler(account.platformName);

    try {
      account.status = AccountStatus.SYNCING;
      await this.accountRepository.save(account);

      const profile = await handler.fetchProfile(decryptedAccessToken);
      account.name = profile.name;
      account.avatar = profile.avatar || account.avatar;
      account.metadata = profile.metadata || account.metadata;
      account.status = AccountStatus.CONNECTED;
      await this.accountRepository.save(account);

      await this.recordSnapshot(account);

      await this.activityLogRepository.save(
        this.activityLogRepository.create({
          userId,
          action: 'PROFILE_SYNCED',
          metadata: { workspaceId, accountId, platform: account.platformName },
        }),
      );

      return account;
    } catch (err: any) {
      account.status = AccountStatus.ERROR;
      await this.accountRepository.save(account);
      throw new Error(`Profile sync failed: ${err.message}`);
    }
  }

  async forceRefresh(
    accountId: string,
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, workspaceId },
    });
    if (!account) {
      throw new NotFoundException('Connected social account not found');
    }

    const token = await this.tokenRepository.findOne({
      where: { connectedAccountId: accountId },
    });
    if (!token || !token.refreshToken) {
      throw new BadRequestException(
        'OAuth refresh token missing. Please reconnect.',
      );
    }

    const decryptedRefreshToken = decrypt(token.refreshToken);
    const handler = this.getPlatformHandler(account.platformName);

    try {
      const result = await handler.refreshTokens(decryptedRefreshToken);
      token.accessToken = encrypt(result.accessToken);
      token.refreshToken = result.refreshToken
        ? encrypt(result.refreshToken)
        : token.refreshToken;
      token.expiresAt = result.expiresIn
        ? new Date(Date.now() + result.expiresIn * 1000)
        : token.expiresAt;
      await this.tokenRepository.save(token);

      account.status = AccountStatus.CONNECTED;
      await this.accountRepository.save(account);

      // Log Activity
      await this.activityLogRepository.save(
        this.activityLogRepository.create({
          userId,
          action: 'TOKEN_REFRESHED',
          metadata: { workspaceId, accountId, platform: account.platformName },
        }),
      );
    } catch (err: any) {
      account.status = AccountStatus.TOKEN_EXPIRED;
      await this.accountRepository.save(account);
      throw new Error(`Token refresh failed: ${err.message}`);
    }
  }

  async refreshExpiredTokens(): Promise<void> {
    const threshold = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    const tokens = await this.tokenRepository.find({
      where: {
        expiresAt: LessThan(threshold),
      },
      relations: { connectedAccount: true },
    });

    for (const token of tokens) {
      if (!token.refreshToken) continue;
      try {
        const decryptedRefreshToken = decrypt(token.refreshToken);
        const handler = this.getPlatformHandler(
          token.connectedAccount.platformName,
        );
        const result = await handler.refreshTokens(decryptedRefreshToken);

        token.accessToken = encrypt(result.accessToken);
        if (result.refreshToken) {
          token.refreshToken = encrypt(result.refreshToken);
        }
        if (result.expiresIn) {
          token.expiresAt = new Date(Date.now() + result.expiresIn * 1000);
        }
        await this.tokenRepository.save(token);

        token.connectedAccount.status = AccountStatus.CONNECTED;
        await this.accountRepository.save(token.connectedAccount);

        this.loggerService.log(
          `Background OAuth token refreshed for account ${token.connectedAccount.name} (${token.connectedAccount.platformName})`,
          'SocialService',
          'application',
        );
      } catch (err: any) {
        this.loggerService.warn(
          `Background OAuth token refresh failed for account ${token.connectedAccount.name}: ${err.message}`,
          'SocialService',
          'application',
        );
        token.connectedAccount.status = AccountStatus.TOKEN_EXPIRED;
        await this.accountRepository.save(token.connectedAccount);
      }
    }
  }

  async syncAllProfilesBackground(): Promise<void> {
    const accounts = await this.accountRepository.find({
      where: { status: AccountStatus.CONNECTED },
    });

    for (const account of accounts) {
      const token = await this.tokenRepository.findOne({
        where: { connectedAccountId: account.id },
      });
      if (!token) continue;

      try {
        const decryptedAccessToken = decrypt(token.accessToken);
        const handler = this.getPlatformHandler(account.platformName);
        const profile = await handler.fetchProfile(decryptedAccessToken);

        account.name = profile.name;
        account.avatar = profile.avatar || account.avatar;
        account.metadata = profile.metadata || account.metadata;
        await this.accountRepository.save(account);

        this.loggerService.log(
          `Background profile synced for account ${account.name} (${account.platformName})`,
          'SocialService',
          'application',
        );
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.loggerService.warn(
          `Background profile sync failed for account ${account.name}: ${errMsg}`,
          'SocialService',
          'application',
        );
        if (errMsg.includes('expired') || errMsg.includes('token')) {
          account.status = AccountStatus.TOKEN_EXPIRED;
        } else {
          account.status = AccountStatus.ERROR;
        }
        await this.accountRepository.save(account);
      }
    }
  }
}
