import { Test, TestingModule } from '@nestjs/testing';
import { SocialService } from '../../../src/social/services/social.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConnectedAccount } from '../../../src/social/entities/connected-account.entity';
import { OAuthToken } from '../../../src/social/entities/oauth-token.entity';
import { Platform } from '../../../src/database/entities/platform.entity';
import { ActivityLog } from '../../../src/users/entities/activity-log.entity';
import { WorkspaceMember } from '../../../src/workspace-members/entities/workspace-member.entity';
import { UsageLimitService } from '../../../src/subscriptions/services/usage-limit.service';
import { LoggerServiceWrapper } from '../../../src/logger/logger.service';
import { YoutubeService } from '../../../src/social/platforms/youtube/youtube.service';
import { FacebookService } from '../../../src/social/platforms/facebook/facebook.service';
import { InstagramService } from '../../../src/social/platforms/instagram/instagram.service';
import { LinkedinService } from '../../../src/social/platforms/linkedin/linkedin.service';
import { TwitterService } from '../../../src/social/platforms/twitter/twitter.service';
import { TwitchService } from '../../../src/social/platforms/twitch/twitch.service';
import { TiktokService } from '../../../src/social/platforms/tiktok/tiktok.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createMockRepository } from '../../mocks/repository.mock';
import { createMockSocialAccount } from '../../fixtures/social.fixture';
import { NotFoundException, BadRequestException } from '@nestjs/common';

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
          provide: getRepositoryToken(WorkspaceMember),
          useValue: createMockRepository(),
        },
        {
          provide: UsageLimitService,
          useValue: { canConnectAccount: jest.fn().mockResolvedValue(true) },
        },
        { provide: LoggerServiceWrapper, useValue: { log: jest.fn() } },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
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

  describe('handleCallback', () => {
    it('should throw BadRequestException if code is missing or empty', async () => {
      await expect(
        socialService.handleCallback('INSTAGRAM', '', 'valid_state'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if state is missing or empty', async () => {
      await expect(
        socialService.handleCallback('INSTAGRAM', 'valid_code', ''),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if state is invalid JSON', async () => {
      const invalidState = Buffer.from('not_valid_json').toString('base64');
      await expect(
        socialService.handleCallback('INSTAGRAM', 'valid_code', invalidState),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if state platform does not match callback platform', async () => {
      const stateObj = {
        workspaceId: 'ws-123',
        userId: 'usr-456',
        platform: 'FACEBOOK',
        timestamp: Date.now(),
      };
      const stateStr = Buffer.from(JSON.stringify(stateObj)).toString('base64');

      await expect(
        socialService.handleCallback('INSTAGRAM', 'valid_code', stateStr),
      ).rejects.toThrow(/platform mismatch/i);
    });

    it('should throw BadRequestException if state is expired (> 15 minutes)', async () => {
      const stateObj = {
        workspaceId: 'ws-123',
        userId: 'usr-456',
        platform: 'INSTAGRAM',
        timestamp: Date.now() - 20 * 60 * 1000, // 20 minutes ago
      };
      const stateStr = Buffer.from(JSON.stringify(stateObj)).toString('base64');

      await expect(
        socialService.handleCallback('INSTAGRAM', 'valid_code', stateStr),
      ).rejects.toThrow(/expired/i);
    });

    it('should reject already consumed authorization code (replay prevention)', async () => {
      const instagramService = (socialService as any).instagramService;
      instagramService.exchangeCode = jest.fn().mockResolvedValue({
        accessToken: 'mock_token',
        expiresIn: 3600,
      });
      instagramService.fetchProfile = jest.fn().mockResolvedValue({
        platformUserId: 'ig_123',
        name: 'IG Test User',
      });
      accountRepo.findOne.mockResolvedValue(null);
      accountRepo.create.mockReturnValue({ id: 'acc_1' });
      accountRepo.save.mockResolvedValue({ id: 'acc_1' });
      tokenRepo.create.mockReturnValue({ id: 'tok_1' });
      tokenRepo.save.mockResolvedValue({ id: 'tok_1' });

      const stateObj = {
        workspaceId: 'ws-123',
        userId: 'usr-456',
        platform: 'INSTAGRAM',
        timestamp: Date.now(),
      };
      const stateStr = Buffer.from(JSON.stringify(stateObj)).toString('base64');
      const reuseCode = 'unique_one_time_code_xyz';

      // First call succeeds
      await socialService.handleCallback('INSTAGRAM', reuseCode, stateStr);

      // Second call with same code must be rejected without calling exchangeCode again
      await expect(
        socialService.handleCallback('INSTAGRAM', reuseCode, stateStr),
      ).rejects.toThrow(/already been consumed/i);

      expect(instagramService.exchangeCode).toHaveBeenCalledTimes(1);
    });
  });
});
