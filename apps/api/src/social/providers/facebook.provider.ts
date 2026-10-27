import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SocialProvider } from '../interfaces/social-provider.interface';
import {
  ConnectedAccount,
  AccountStatus,
} from '../entities/connected-account.entity';
import { OAuthToken } from '../entities/oauth-token.entity';
import {
  SocialAccount,
  SocialAccountStatus,
} from '../entities/social-account.entity';
import { FacebookService } from '../services/facebook.service';
import { encrypt } from '../utils/crypto.helper';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { WorkspaceMember } from '../../workspace-members/entities/workspace-member.entity';

@Injectable()
export class FacebookProvider implements SocialProvider {
  private readonly logger = new Logger(FacebookProvider.name);

  constructor(
    @InjectRepository(SocialAccount)
    private readonly socialAccountRepository: Repository<SocialAccount>,
    @InjectRepository(ConnectedAccount)
    private readonly accountRepository: Repository<ConnectedAccount>,
    @InjectRepository(OAuthToken)
    private readonly tokenRepository: Repository<OAuthToken>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
    private readonly facebookService: FacebookService,
  ) {}

  /**
   * Generates OAuth Authorization URL with CSRF state validation token.
   */
  connect(userId: string, customState?: string, workspaceId?: string): string {
    const stateObj = {
      userId,
      workspaceId,
      nonce: Math.random().toString(36).substring(2),
      customState,
      timestamp: Date.now(),
    };
    const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');
    return this.facebookService.generateAuthUrl(state);
  }

  /**
   * Processes OAuth callback, retrieves user & page credentials, encrypts tokens, and stores SocialAccount records.
   */
  async handleCallback(
    code: string,
    userId: string,
    stateStr?: string,
  ): Promise<SocialAccount[]> {
    let stateWorkspaceId: string | undefined;
    if (stateStr) {
      try {
        const decoded = JSON.parse(
          Buffer.from(stateStr, 'base64').toString('utf8'),
        ) as { userId?: string; workspaceId?: string };
        if (decoded?.userId && decoded.userId !== userId) {
          throw new BadRequestException(
            'OAuth state validation failed: user mismatch',
          );
        }
        if (decoded?.workspaceId) {
          stateWorkspaceId = decoded.workspaceId;
        }
      } catch (err: unknown) {
        if (err instanceof BadRequestException) throw err;
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Could not parse state token: ${msg}`);
      }
    }

    // 1. Exchange auth code for User Access Token
    const tokenResult = await this.facebookService.exchangeCodeForToken(code);
    const userAccessToken = tokenResult.accessToken;

    // 2. Fetch Facebook user details
    const fbUser = await this.facebookService.getFacebookUser(userAccessToken);

    // 3. Fetch Facebook pages managed by user
    const fbPages =
      await this.facebookService.getFacebookPages(userAccessToken);

    const savedAccounts: SocialAccount[] = [];
    const encryptedUserToken = encrypt(userAccessToken);
    const tokenExpiresAt = tokenResult.expiresIn
      ? new Date(Date.now() + tokenResult.expiresIn * 1000)
      : undefined;

    if (fbPages.length === 0) {
      // User has no pages; save primary user account
      let account = await this.socialAccountRepository.findOne({
        where: {
          userId,
          provider: In(['facebook', 'FACEBOOK']),
          providerUserId: fbUser.id,
          pageId: undefined,
        },
      });

      if (!account) {
        account = this.socialAccountRepository.create({
          userId,
          provider: 'facebook',
          providerUserId: fbUser.id,
          providerName: fbUser.name,
          providerEmail: fbUser.email,
        });
      }

      const activeScopesStr = this.facebookService.scopes.join(',');

      account.provider = 'facebook';
      account.providerName = fbUser.name;
      account.providerEmail = fbUser.email || account.providerEmail;
      account.accessToken = encryptedUserToken;
      account.expiresAt = tokenExpiresAt || account.expiresAt;
      account.scopes = activeScopesStr;
      account.connected = true;
      account.status = SocialAccountStatus.CONNECTED;

      const saved = await this.socialAccountRepository.save(account);
      await this.syncConnectedAccount(saved, stateWorkspaceId);
      savedAccounts.push(saved);
    } else {
      // Save or update a SocialAccount record for each connected page
      const activeScopesStr = this.facebookService.scopes.join(',');
      for (const page of fbPages) {
        let account = await this.socialAccountRepository.findOne({
          where: {
            userId,
            provider: In(['facebook', 'FACEBOOK']),
            providerUserId: fbUser.id,
            pageId: page.id,
          },
        });

        if (!account) {
          account = this.socialAccountRepository.create({
            userId,
            provider: 'facebook',
            providerUserId: fbUser.id,
            pageId: page.id,
          });
        }

        account.provider = 'facebook';
        account.providerName = fbUser.name;
        account.providerEmail = fbUser.email || account.providerEmail;
        account.pageName = page.name;
        account.accessToken = encryptedUserToken;
        account.pageAccessToken = encrypt(page.access_token);
        account.expiresAt = tokenExpiresAt || account.expiresAt;
        account.scopes = activeScopesStr;
        account.connected = true;
        account.status = SocialAccountStatus.CONNECTED;

        const saved = await this.socialAccountRepository.save(account);
        await this.syncConnectedAccount(saved, stateWorkspaceId);
        savedAccounts.push(saved);
      }
    }

    const maskedToken =
      encryptedUserToken.length > 24
        ? `${encryptedUserToken.substring(0, 12)}...${encryptedUserToken.substring(encryptedUserToken.length - 8)}`
        : '[ENCRYPTED]';

    const expiresStr = tokenExpiresAt
      ? tokenExpiresAt.toISOString()
      : 'Never (Long-Lived)';

    // Print clear formatted banner in terminal console

    console.log('\n' + '═'.repeat(72));
    console.log(' 🚀 [FACEBOOK OAUTH CONNECTED & SAVED FOR LIVE STREAMING]');
    console.log('═'.repeat(72));
    console.log(` 👤 NexaSocial User ID : ${userId}`);
    console.log(` 🆔 Facebook User ID   : ${fbUser.id}`);
    console.log(` 📛 Facebook Name      : ${fbUser.name}`);
    console.log(` 📧 Facebook Email     : ${fbUser.email || 'Not Provided'}`);
    console.log(` 🔐 Encrypted Token    : ${maskedToken}`);
    console.log(` ⏱️  Token Expiration  : ${expiresStr}`);
    console.log(` 📡 Total Accounts/Pages Saved : ${savedAccounts.length}`);
    console.log('─'.repeat(72));
    savedAccounts.forEach((acc, idx) => {
      console.log(
        `   [Account ${idx + 1}] DB ID: ${acc.id} | Page/Profile ID: ${acc.pageId || acc.providerUserId} | Name: "${acc.pageName || acc.providerName}" | Status: ${acc.status}`,
      );
    });
    console.log('═'.repeat(72) + '\n');

    this.logger.log(
      `Successfully connected ${savedAccounts.length} Facebook account(s) for user ${userId}`,
    );

    return savedAccounts;
  }

  /**
   * Disconnects a connected Facebook account by ID.
   */
  async disconnect(id: string, userId: string): Promise<void> {
    let account = await this.socialAccountRepository.findOne({
      where: { id, provider: In(['facebook', 'FACEBOOK']) },
    });

    if (!account) {
      account = await this.socialAccountRepository.findOne({
        where: [
          { pageId: id, provider: In(['facebook', 'FACEBOOK']) },
          { providerUserId: id, provider: In(['facebook', 'FACEBOOK']) },
        ],
      });
    }

    // Also check connected_accounts if passed ID is from connected_accounts
    const connAcc = await this.accountRepository.findOne({
      where: { id },
    });

    if (!account && connAcc?.platformUserId) {
      account = await this.socialAccountRepository.findOne({
        where: [
          { pageId: connAcc.platformUserId, provider: In(['facebook', 'FACEBOOK']) },
          { providerUserId: connAcc.platformUserId, provider: In(['facebook', 'FACEBOOK']) },
        ],
      });
    }

    if (!account && !connAcc) {
      throw new NotFoundException('Facebook account connection not found');
    }

    if (account) {
      const pageId = account.pageId;
      const providerUserId = account.providerUserId;
      const accountId = account.id;

      account.connected = false;
      account.status = SocialAccountStatus.DISCONNECTED;
      await this.socialAccountRepository.remove(account);

      // Clean up connected_accounts matching this Facebook account
      const connectedAccounts = await this.accountRepository.find({
        where: [
          { id: accountId },
          ...(pageId ? [{ platformUserId: pageId }] : []),
          ...(providerUserId ? [{ platformUserId: providerUserId }] : []),
        ],
      });

      for (const ca of connectedAccounts) {
        await this.accountRepository.remove(ca);
        await this.tokenRepository.delete({ connectedAccountId: ca.id });
      }

      await this.tokenRepository.delete({ connectedAccountId: accountId });
    }

    if (connAcc) {
      await this.accountRepository.remove(connAcc);
      await this.tokenRepository.delete({ connectedAccountId: connAcc.id });
    }

    this.logger.log(
      `Disconnected Facebook account ID ${id} for user ${userId} (cleaned up social_accounts & connected_accounts)`,
    );
  }

  /**
   * Gets all active connected Facebook accounts for user and workspace context.
   */
  async getAccounts(userId: string, workspaceId?: string): Promise<SocialAccount[]> {
    let userIds = [userId];

    if (workspaceId) {
      try {
        const workspace = await this.workspaceRepository.findOne({ where: { id: workspaceId } });
        if (workspace?.ownerId) {
          userIds.push(workspace.ownerId);
        }
        const members = await this.memberRepository.find({ where: { workspaceId } });
        members.forEach((m) => userIds.push(m.userId));
      } catch (e: unknown) {
        this.logger.warn(`Could not resolve workspace userIds for workspace ${workspaceId}: ${e}`);
      }
    }

    userIds = Array.from(new Set(userIds));

    const accounts = await this.socialAccountRepository.find({
      where: [
        {
          userId: In(userIds),
          provider: In(['facebook', 'FACEBOOK']),
          connected: true,
          status: SocialAccountStatus.CONNECTED,
        },
      ],
      order: { connectedAt: 'DESC' },
    });

    if (workspaceId && accounts.length > 0) {
      for (const acc of accounts) {
        await this.syncConnectedAccount(acc, workspaceId);
      }
    }

    return accounts;
  }

  refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    return Promise.resolve({ accessToken: refreshToken, expiresIn: 5184000 });
  }

  private async syncConnectedAccount(
    saved: SocialAccount,
    workspaceId?: string,
  ) {
    try {
      let targetWorkspaceId = workspaceId;
      if (!targetWorkspaceId) {
        const workspace = await this.workspaceRepository.findOne({ where: { ownerId: saved.userId } });
        if (workspace) {
          targetWorkspaceId = workspace.id;
        } else {
          const member = await this.memberRepository.findOne({ where: { userId: saved.userId } });
          targetWorkspaceId = member?.workspaceId;
        }
      }

      if (!targetWorkspaceId) {
        this.logger.warn(
          `Cannot sync Facebook account ${saved.id}: No workspace context found for user ${saved.userId}`,
        );
        return;
      }

      let connAcc = await this.accountRepository.findOne({
        where: { id: saved.id },
      });
      if (!connAcc) {
        connAcc = this.accountRepository.create({
          id: saved.id,
          workspaceId: targetWorkspaceId,
          platformName: 'FACEBOOK',
          platformUserId: saved.pageId || saved.providerUserId,
          name: saved.pageName || saved.providerName || 'Facebook Page',
          status: AccountStatus.CONNECTED,
        });
        await this.accountRepository.save(connAcc);
      } else {
        connAcc.workspaceId = targetWorkspaceId;
        connAcc.name = saved.pageName || saved.providerName || connAcc.name;
        connAcc.status = AccountStatus.CONNECTED;
        await this.accountRepository.save(connAcc);
      }

      let tokenRec = await this.tokenRepository.findOne({
        where: { connectedAccountId: saved.id },
      });
      if (!tokenRec) {
        tokenRec = this.tokenRepository.create({
          connectedAccountId: saved.id,
          accessToken: saved.pageAccessToken || saved.accessToken || '',
          expiresAt: saved.expiresAt,
          scope: saved.scopes,
        });
        await this.tokenRepository.save(tokenRec);
      } else {
        tokenRec.accessToken =
          saved.pageAccessToken || saved.accessToken || tokenRec.accessToken;
        tokenRec.expiresAt = saved.expiresAt || tokenRec.expiresAt;
        tokenRec.scope = saved.scopes || tokenRec.scope;
        await this.tokenRepository.save(tokenRec);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Could not sync ConnectedAccount table: ${msg}`);
    }
  }
}
