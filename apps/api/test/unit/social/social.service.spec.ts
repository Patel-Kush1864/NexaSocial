import { Test, TestingModule } from '@nestjs/testing';
import { SocialService } from '../../../src/social/services/social.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConnectedAccount } from '../../../src/social/entities/connected-account.entity';
import { OAuthToken } from '../../../src/social/entities/oauth-token.entity';
import { Platform } from '../../../src/database/entities/platform.entity';
import { ActivityLog } from '../../../src/users/entities/activity-log.entity';
import { UsageLimitService } from '../../../src/subscriptions/services/usage-limit.service';
import { LoggerServiceWrapper } from '../../../src/logger/logger.service';
import { YoutubeService } from '../../../src/social/platforms/youtube/youtube.service';
import { FacebookService } from '../../../src/social/platforms/facebook/facebook.service';
import { InstagramService } from '../../../src/social/platforms/instagram/instagram.service';
import { LinkedinService } from '../../../src/social/platforms/linkedin/linkedin.service';
import { TwitterService } from '../../../src/social/platforms/twitter/twitter.service';
import { TwitchService } from '../../../src/social/platforms/twitch/twitch.service';
import { TiktokService } from '../../../src/social/platforms/tiktok/tiktok.service';
import { createMockRepository } from '../../mocks/repository.mock';
import { createMockSocialAccount } from '../../fixtures/social.fixture';
import { NotFoundException } from '@nestjs/common';

describe('SocialService (Unit & OAuth Platform Testing)', () => {
  let socialService: SocialService;
  let accountRepo: any;
  let tokenRepo: any;

  beforeEach(async () => {
    accountRepo = createMockRepository();
    tokenRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialService,
        {
          provide: getRepositoryToken(ConnectedAccount),
          useValue: accountRepo,
        },
        { provide: getRepositoryToken(OAuthToken), useValue: tokenRepo },
        {
          provide: getRepositoryToken(Platform),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(ActivityLog),
          useValue: createMockRepository(),
        },
        {
          provide: UsageLimitService,
          useValue: { canConnectAccount: jest.fn().mockResolvedValue(true) },
        },
        { provide: LoggerServiceWrapper, useValue: { log: jest.fn() } },
        {
          provide: YoutubeService,
          useValue: { getAuthUrl: jest.fn(), handleCallback: jest.fn() },
        },
        {
          provide: FacebookService,
          useValue: { getAuthUrl: jest.fn(), handleCallback: jest.fn() },
        },
        {
          provide: InstagramService,
          useValue: { getAuthUrl: jest.fn(), handleCallback: jest.fn() },
        },
        {
          provide: LinkedinService,
          useValue: { getAuthUrl: jest.fn(), handleCallback: jest.fn() },
        },
        {
          provide: TwitterService,
          useValue: { getAuthUrl: jest.fn(), handleCallback: jest.fn() },
        },
        {
          provide: TwitchService,
          useValue: { getAuthUrl: jest.fn(), handleCallback: jest.fn() },
        },
        {
          provide: TiktokService,
          useValue: { getAuthUrl: jest.fn(), handleCallback: jest.fn() },
        },
      ],
    }).compile();

    socialService = module.get<SocialService>(SocialService);
  });

  describe('getConnectedAccounts', () => {
    it('should return connected accounts for a workspace', async () => {
      const mockAccount = createMockSocialAccount('YOUTUBE');
      accountRepo.find.mockResolvedValue([mockAccount]);

      const result = await socialService.getConnectedAccounts(
        mockAccount.workspaceId,
      );
      expect(result).toBeDefined();
      expect(accountRepo.find).toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should throw NotFoundException if account is missing', async () => {
      accountRepo.findOne.mockResolvedValue(null);
      await expect(
        socialService.disconnect('invalid-acc', 'ws-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should remove account record for valid account', async () => {
      const mockAccount = createMockSocialAccount('FACEBOOK');
      accountRepo.findOne.mockResolvedValue(mockAccount);
      accountRepo.remove.mockResolvedValue(mockAccount);

      await socialService.disconnect(
        mockAccount.id,
        mockAccount.workspaceId,
        'user-1',
      );
      expect(accountRepo.remove).toHaveBeenCalled();
    });
  });
});
