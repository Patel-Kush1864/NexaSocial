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
  SocialAccount,
  SocialAccountStatus,
} from '../entities/social-account.entity';
import { FacebookService } from '../services/facebook.service';
import { encrypt } from '../utils/crypto.helper';

@Injectable()
export class FacebookProvider implements SocialProvider {
  private readonly logger = new Logger(FacebookProvider.name);

  constructor(
    @InjectRepository(SocialAccount)
    private readonly socialAccountRepository: Repository<SocialAccount>,
    private readonly facebookService: FacebookService,
  ) {}

  /**
   * Generates OAuth Authorization URL with CSRF state validation token.
   */
  connect(userId: string, customState?: string): string {
    const stateObj = {
      userId,
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
    if (stateStr) {
      try {
        const decoded = JSON.parse(
          Buffer.from(stateStr, 'base64').toString('utf8'),
        ) as { userId?: string };
        if (decoded?.userId && decoded.userId !== userId) {
          throw new BadRequestException(
            'OAuth state validation failed: user mismatch',
          );
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

      account.provider = 'facebook';
      account.providerName = fbUser.name;
      account.providerEmail = fbUser.email || account.providerEmail;
      account.accessToken = encryptedUserToken;
      account.expiresAt = tokenExpiresAt || account.expiresAt;
      account.connected = true;
      account.status = SocialAccountStatus.CONNECTED;

      const saved = await this.socialAccountRepository.save(account);
      savedAccounts.push(saved);
    } else {
      // Save or update a SocialAccount record for each connected page
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
        account.connected = true;
        account.status = SocialAccountStatus.CONNECTED;

        const saved = await this.socialAccountRepository.save(account);
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
    const account = await this.socialAccountRepository.findOne({
      where: { id, userId, provider: In(['facebook', 'FACEBOOK']) },
    });

    if (!account) {
      throw new NotFoundException('Facebook account connection not found');
    }

    account.connected = false;
    account.status = SocialAccountStatus.DISCONNECTED;
    await this.socialAccountRepository.remove(account);
    this.logger.log(
      `Disconnected Facebook account ID ${id} for user ${userId}`,
    );
  }

  /**
   * Gets all active connected Facebook accounts for user.
   */
  async getAccounts(userId: string): Promise<SocialAccount[]> {
    return this.socialAccountRepository.find({
      where: [
        {
          userId,
          provider: In(['facebook', 'FACEBOOK']),
          connected: true,
        },
        {
          userId,
          provider: In(['facebook', 'FACEBOOK']),
          status: SocialAccountStatus.CONNECTED,
        },
      ],
      order: { connectedAt: 'DESC' },
    });
  }

  refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    return Promise.resolve({ accessToken: refreshToken, expiresIn: 5184000 });
  }
}
