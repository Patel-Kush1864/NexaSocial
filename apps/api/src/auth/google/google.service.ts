import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConnectedAccount,
  AccountStatus,
} from '../../social/entities/connected-account.entity';
import { OAuthToken } from '../../social/entities/oauth-token.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { User } from '../../users/entities/user.entity';
import { encrypt } from '../../social/utils/crypto.helper';
import { GoogleUserProfile } from './google.strategy';

@Injectable()
export class GoogleService {
  private readonly logger = new Logger(GoogleService.name);

  constructor(
    @InjectRepository(ConnectedAccount)
    private readonly accountRepository: Repository<ConnectedAccount>,
    @InjectRepository(OAuthToken)
    private readonly tokenRepository: Repository<OAuthToken>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async handleGoogleCallback(
    profile: GoogleUserProfile,
    workspaceId?: string,
  ): Promise<ConnectedAccount> {
    let targetWorkspaceId = workspaceId;

    if (targetWorkspaceId) {
      const exists = await this.workspaceRepository.findOne({
        where: { id: targetWorkspaceId },
      });
      if (!exists) {
        targetWorkspaceId = undefined;
      }
    }

    if (!targetWorkspaceId) {
      const defaultWorkspaces = await this.workspaceRepository.find({
        order: { created_at: 'ASC' },
        take: 1,
      });
      const defaultWorkspace = defaultWorkspaces[0];
      if (defaultWorkspace) {
        targetWorkspaceId = defaultWorkspace.id;
      } else {
        const firstUsers = await this.userRepository.find({
          order: { created_at: 'ASC' },
          take: 1,
        });
        const firstUser = firstUsers[0];
        if (!firstUser) {
          throw new BadRequestException(
            'Cannot connect YouTube account: No active workspace found.',
          );
        }
        const newWorkspace = this.workspaceRepository.create({
          ownerId: firstUser.id,
          name: 'Main Workspace',
          slug: 'main-workspace-' + Math.random().toString(36).substring(7),
          status: 'ACTIVE',
        });
        const savedWs = await this.workspaceRepository.save(newWorkspace);
        targetWorkspaceId = savedWs.id;
      }
    }

    let account = await this.accountRepository.findOne({
      where: {
        workspaceId: targetWorkspaceId,
        platformName: 'YOUTUBE',
        platformUserId: profile.googleId,
      },
    });

    const accountName =
      `${profile.firstName} ${profile.lastName}`.trim() ||
      profile.email ||
      'YouTube Channel';

    if (account) {
      account.name = accountName;
      account.avatar = profile.picture || account.avatar;
      account.status = AccountStatus.CONNECTED;
      account.metadata = {
        ...(account.metadata || {}),
        email: profile.email,
        googleId: profile.googleId,
        liveStreamingEnabled: true,
        isLiveStreamingEligible: true,
      };
      await this.accountRepository.save(account);

      let tokenRecord = await this.tokenRepository.findOne({
        where: { connectedAccountId: account.id },
      });

      if (!tokenRecord) {
        tokenRecord = this.tokenRepository.create({
          connectedAccountId: account.id,
        });
      }

      tokenRecord.accessToken = encrypt(profile.accessToken);
      if (profile.refreshToken) {
        tokenRecord.refreshToken = encrypt(profile.refreshToken);
      }
      tokenRecord.expiresAt = new Date(Date.now() + 3600 * 1000);
      tokenRecord.scope =
        'openid email profile https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.readonly';
      tokenRecord.tokenType = 'Bearer';

      await this.tokenRepository.save(tokenRecord);
    } else {
      account = this.accountRepository.create({
        workspaceId: targetWorkspaceId,
        platformName: 'YOUTUBE',
        platformUserId: profile.googleId,
        name: accountName,
        avatar: profile.picture,
        status: AccountStatus.CONNECTED,
        metadata: {
          email: profile.email,
          googleId: profile.googleId,
          liveStreamingEnabled: true,
          isLiveStreamingEligible: true,
        },
      });
      await this.accountRepository.save(account);

      const tokenRecord = this.tokenRepository.create({
        connectedAccountId: account.id,
        accessToken: encrypt(profile.accessToken),
        refreshToken: profile.refreshToken
          ? encrypt(profile.refreshToken)
          : undefined,
        expiresAt: new Date(Date.now() + 3600 * 1000),
        scope:
          'openid email profile https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.readonly',
        tokenType: 'Bearer',
      });
      await this.tokenRepository.save(tokenRecord);
    }

    this.logger.log(`Google OAuth YouTube account connected: ${account.name}`);
    return account;
  }
}
