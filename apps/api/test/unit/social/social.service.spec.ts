import { Test, TestingModule } from '@nestjs/testing';
import { SocialService } from '../../../src/social/services/social.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConnectedAccount } from '../../../src/social/entities/connected-account.entity';
import { SocialAccount } from '../../../src/social/entities/social-account.entity';
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
import { SocialAnalyticsSnapshot } from '../../../src/dashboard/entities/social-analytics-snapshot.entity';
import { createMockRepository } from '../../mocks/repository.mock';
import { createMockSocialAccount } from '../../fixtures/social.fixture';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SocialService (Unit & OAuth Platform Testing)', () => {
  let socialService: SocialService;
  let accountRepo: any;
  let socialAccountRepo: any;
  let tokenRepo: any;

  beforeEach(async () => {
    accountRepo = createMockRepository();
    socialAccountRepo = createMockRepository();
    tokenRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialService,
        {
          provide: getRepositoryToken(ConnectedAccount),
          useValue: accountRepo,
        },
        {
          provide: getRepositoryToken(SocialAccount),
          useValue: socialAccountRepo,
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
          provide: getRepositoryToken(SocialAnalyticsSnapshot),
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
          useValue: {
            getAuthUrl: jest.fn(),
            handleCallback: jest.fn(),
            getPreflightDiagnostics: jest
              .fn()
              .mockReturnValue({ isValid: true, errors: [] }),
          },
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
    it('should throw NotFoundException if account is missing in both repos', async () => {
      accountRepo.findOne.mockResolvedValue(null);
      socialAccountRepo.findOne.mockResolvedValue(null);
      await expect(
        socialService.disconnect('invalid-acc', 'ws-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should remove account record for valid account', async () => {
      const mockAccount = createMockSocialAccount('FACEBOOK');
      accountRepo.findOne.mockResolvedValue(mockAccount);
      accountRepo.remove.mockResolvedValue(mockAccount);
      socialAccountRepo.findOne.mockResolvedValue(null);

      await socialService.disconnect(
        mockAccount.id,
        mockAccount.workspaceId,
        'user-1',
      );
      expect(accountRepo.remove).toHaveBeenCalled();
    });

    it('should remove matching socialAccount and connected accounts', async () => {
      const mockSocialAcc = {
        id: 'soc-123',
        pageId: 'page-456',
        provider: 'facebook',
        pageName: 'My Facebook Page',
      };
      accountRepo.findOne.mockResolvedValue(null);
      socialAccountRepo.findOne.mockResolvedValue(mockSocialAcc);
      socialAccountRepo.remove.mockResolvedValue(mockSocialAcc);
      accountRepo.find.mockResolvedValue([]);

      await socialService.disconnect('soc-123', 'ws-1', 'user-1');
      expect(socialAccountRepo.remove).toHaveBeenCalledWith(mockSocialAcc);
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

  describe('getPreflightDiagnostics & connect validation', () => {
    it('should return Instagram preflight diagnostics when queried', () => {
      const mockDiag = {
        flow: 'Instagram API with Instagram Login (Business Login for Instagram)',
        authHost: 'https://www.instagram.com',
        authPath: '/oauth/authorize',
        maskedClientId: '***********4737',
        hasClientSecret: true,
        canonicalRedirectUri: 'http://localhost:5000/api/social/callback/instagram',
        backendCallbackRoute: '/api/social/callback/instagram',
        tokenExchangeUri: 'http://localhost:5000/api/social/callback/instagram',
        scheme: 'http',
        hostname: 'localhost',
        port: '5000',
        path: '/api/social/callback/instagram',
        hasTrailingSlash: false,
        isHttps: false,
        isLocalhost: true,
        metaDashboardLocation: 'Meta Developer Dashboard > Instagram > API setup with Instagram login',
        isValid: true,
        errors: [],
        diagnosticComparison: {
          configuredMatchesCanonical: true,
          authMatchesTokenExchange: true,
          routeMatchesBackendRouter: true,
          noDoubleEncoding: true,
        },
      };

      const instagramService = (socialService as any).instagramService;
      instagramService.getPreflightDiagnostics = jest.fn().mockReturnValue(mockDiag);

      const res = socialService.getPreflightDiagnostics('INSTAGRAM');
      expect(res).toEqual(mockDiag);
      expect(instagramService.getPreflightDiagnostics).toHaveBeenCalled();
    });

    it('should reject connect if Instagram preflight fails', async () => {
      const instagramService = (socialService as any).instagramService;
      instagramService.getPreflightDiagnostics = jest.fn().mockReturnValue({
        isValid: false,
        errors: ['Missing INSTAGRAM_CLIENT_ID in server environment'],
      });

      await expect(
        socialService.connect('INSTAGRAM', 'ws-123', 'usr-456'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should route to correct handler for other social platforms (YouTube, Facebook, Twitter/X)', async () => {
      const youtubeService = (socialService as any).youtubeService;
      youtubeService.getAuthUrl = jest.fn().mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth?scope=yt');

      const ytRes = await socialService.connect('YOUTUBE', 'ws-123', 'usr-456');
      expect(ytRes.url).toContain('https://accounts.google.com');

      const facebookService = (socialService as any).facebookService;
      facebookService.getAuthUrl = jest.fn().mockReturnValue('https://www.facebook.com/v23.0/dialog/oauth');

      const fbRes = await socialService.connect('FACEBOOK', 'ws-123', 'usr-456');
      expect(fbRes.url).toContain('https://www.facebook.com');

      const twitterService = (socialService as any).twitterService;
      twitterService.getAuthUrl = jest.fn().mockReturnValue('https://twitter.com/i/oauth2/authorize');

      const twRes = await socialService.connect('X', 'ws-123', 'usr-456');
      expect(twRes.url).toContain('https://twitter.com');
    });
  });
});
