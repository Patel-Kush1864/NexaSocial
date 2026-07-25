/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  ConnectedAccount,
  AccountStatus,
} from '../entities/connected-account.entity';
import { OAuthToken } from '../entities/oauth-token.entity';
import { Platform } from '../../database/entities/platform.entity';
import { ActivityLog } from '../../users/entities/activity-log.entity';
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

@Injectable()
export class SocialService {
  constructor(
    @InjectRepository(ConnectedAccount)
    private readonly accountRepository: Repository<ConnectedAccount>,
    @InjectRepository(OAuthToken)
    private readonly tokenRepository: Repository<OAuthToken>,
    @InjectRepository(Platform)
    private readonly platformRepository: Repository<Platform>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    private readonly usageLimitService: UsageLimitService,
    private readonly loggerService: LoggerServiceWrapper,

    // Inject Platform Services
    private readonly youtubeService: YoutubeService,
    private readonly facebookService: FacebookService,
    private readonly instagramService: InstagramService,
    private readonly linkedinService: LinkedinService,
    private readonly twitterService: TwitterService,
    private readonly twitchService: TwitchService,
    private readonly tiktokService: TiktokService,
  ) {}

  private getPlatformHandler(platform: string): PlatformHandler {
    const p = platform.toUpperCase();
    if (p === 'YOUTUBE') return this.youtubeService;
    if (p === 'FACEBOOK') return this.facebookService;
    if (p === 'INSTAGRAM') return this.instagramService;
    if (p === 'LINKEDIN') return this.linkedinService;
    if (p === 'TWITTER' || p === 'X') return this.twitterService;
    if (p === 'TWITCH') return this.twitchService;
    if (p === 'TIKTOK') return this.tiktokService;
    throw new BadRequestException(`Unsupported social platform: ${platform}`);
  }

  async getPlatforms(): Promise<Platform[]> {
    return this.platformRepository.find({ where: { isActive: true } });
  }

  async connect(
    platform: string,
    workspaceId: string,
    userId: string,
  ): Promise<{ url: string }> {
    // Check subscription limit first
    const allowed = await this.usageLimitService.canConnectAccount(userId);
    if (!allowed) {
      throw new BadRequestException(
        'Workspace social account limit reached. Please upgrade your plan.',
      );
    }

    const handler = this.getPlatformHandler(platform);
    // Encode state parameters securely
    const stateObj = { workspaceId, platform: platform.toUpperCase(), userId };
    const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');

    return { url: handler.getAuthUrl(state) };
  }

  async handleCallback(
    platform: string,
    code: string,
    stateStr: string,
  ): Promise<ConnectedAccount> {
    let workspaceId = '';
    let userId = '';
    try {
      const decoded = JSON.parse(
        Buffer.from(stateStr, 'base64').toString('utf8'),
      );
      workspaceId = decoded.workspaceId;
      userId = decoded.userId;
    } catch {
      throw new BadRequestException(
        'OAuth state validation parameter is invalid',
      );
    }

    const handler = this.getPlatformHandler(platform);
    const oauthResult = await handler.exchangeCode(code);
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

    return account;
  }

  async getConnectedAccounts(workspaceId: string): Promise<ConnectedAccount[]> {
    return this.accountRepository.find({
      where: { workspaceId },
      order: { created_at: 'DESC' },
    });
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
    const account = await this.accountRepository.findOne({
      where: { id: accountId, workspaceId },
    });
    if (!account) {
      throw new NotFoundException('Connected social account not found');
    }

    // Remove from database (tokens cascade delete automatically because of CASCADE constraints)
    const accountName = account.name;
    const platform = account.platformName;
    await this.accountRepository.remove(account);

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
  }

  async syncAccount(
    accountId: string,
    workspaceId: string,
    userId: string,
  ): Promise<ConnectedAccount> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, workspaceId },
    });
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

    const decryptedAccessToken = decrypt(token.accessToken);
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
