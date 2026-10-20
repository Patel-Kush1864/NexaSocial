import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InstagramService } from '../../../src/social/platforms/instagram/instagram.service';
import { InternalServerErrorException, BadRequestException } from '@nestjs/common';

describe('InstagramService (Unit)', () => {
  let service: InstagramService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstagramService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'INSTAGRAM_CLIENT_ID') return 'mock_ig_client_id';
              if (key === 'INSTAGRAM_CLIENT_SECRET') return 'mock_ig_client_secret';
              if (key === 'INSTAGRAM_REDIRECT_URI')
                return 'http://localhost:5000/api/social/callback/instagram';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<InstagramService>(InstagramService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAuthUrl', () => {
    it('should generate a valid Instagram OAuth URL with required scope and state', () => {
      const state = 'test_state_xyz';
      const authUrl = service.getAuthUrl(state);

      expect(authUrl).toContain('https://www.instagram.com/oauth/authorize');
      expect(authUrl).toContain('client_id=mock_ig_client_id');
      expect(authUrl).toContain('state=test_state_xyz');
      expect(authUrl).toContain('scope=instagram_business_basic');
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain(
        encodeURIComponent('http://localhost:5000/api/social/callback/instagram'),
      );
    });

    it('should throw InternalServerErrorException if client ID is missing', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);
      delete process.env.INSTAGRAM_CLIENT_ID;

      expect(() => service.getAuthUrl('state')).toThrow(InternalServerErrorException);
    });

    it('should use single canonical redirect URI from configuration', () => {
      expect(service.canonicalRedirectUri).toBe(
        'http://localhost:5000/api/social/callback/instagram',
      );
    });

    it('should normalize and strip trailing slash from INSTAGRAM_REDIRECT_URI', () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'INSTAGRAM_CLIENT_ID') return 'mock_ig_client_id';
        if (key === 'INSTAGRAM_CLIENT_SECRET') return 'mock_ig_client_secret';
        if (key === 'INSTAGRAM_REDIRECT_URI')
          return 'https://rubbing-grasp-subscript.ngrok-free.dev/api/social/callback/instagram/';
        return null;
      });

      expect(service.canonicalRedirectUri).toBe(
        'https://rubbing-grasp-subscript.ngrok-free.dev/api/social/callback/instagram',
      );
    });

    it('should fall back to APP_URL if INSTAGRAM_REDIRECT_URI is not set', () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'INSTAGRAM_CLIENT_ID') return 'mock_ig_client_id';
        if (key === 'INSTAGRAM_CLIENT_SECRET') return 'mock_ig_client_secret';
        if (key === 'APP_URL') return 'https://nexasocial.com';
        return null;
      });

      expect(service.canonicalRedirectUri).toBe(
        'https://nexasocial.com/api/social/callback/instagram',
      );
    });
  });

  describe('validateConfiguration', () => {
    it('should return true when all credentials are set', () => {
      expect(service.validateConfiguration()).toBe(true);
    });

    it('should return false when client ID is missing', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);
      delete process.env.INSTAGRAM_CLIENT_ID;

      expect(service.validateConfiguration()).toBe(false);
    });
  });

  describe('checkEligibility', () => {
    it('should mark BUSINESS account as eligible', () => {
      const res = service.checkEligibility({ accountType: 'BUSINESS' });
      expect(res.isEligible).toBe(true);
      expect(res.accountType).toBe('BUSINESS');
    });

    it('should mark MEDIA_CREATOR account as eligible', () => {
      const res = service.checkEligibility({ accountType: 'MEDIA_CREATOR' });
      expect(res.isEligible).toBe(true);
      expect(res.accountType).toBe('MEDIA_CREATOR');
    });

    it('should mark PERSONAL account as not eligible with guided advice', () => {
      const res = service.checkEligibility({ accountType: 'PERSONAL' });
      expect(res.isEligible).toBe(false);
      expect(res.accountType).toBe('PERSONAL');
      expect(res.reason).toContain('Personal Instagram accounts do not have access');
      expect(res.requiredAction).toContain('Professional (Creator or Business) account');
    });

    it('should default optimistic for unknown or missing account type', () => {
      const res = service.checkEligibility({});
      expect(res.isEligible).toBe(true);
      expect(res.accountType).toBe('UNKNOWN');
    });
  });

  describe('exchangeCode', () => {
    it('should exchange authorization code for tokens and upgrade to long-lived', async () => {
      const mockShortLivedResponse = {
        access_token: 'short_lived_token_123',
        user_id: 1784140000000,
      };

      const mockLongLivedResponse = {
        access_token: 'long_lived_token_456',
        token_type: 'bearer',
        expires_in: 5184000,
      };

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockShortLivedResponse,
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockLongLivedResponse,
        } as any);

      const result = await service.exchangeCode('test_auth_code');

      expect(result.accessToken).toBe('long_lived_token_456');
      expect(result.expiresIn).toBe(5184000);
    });

    it('should strip trailing #_ appended by Instagram web redirection', async () => {
      const mockShortLivedResponse = {
        access_token: 'short_lived_token_123',
        user_id: 1784140000000,
      };

      const mockLongLivedResponse = {
        access_token: 'long_lived_token_456',
        token_type: 'bearer',
        expires_in: 5184000,
      };

      const fetchSpy = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockShortLivedResponse,
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockLongLivedResponse,
        } as any);

      global.fetch = fetchSpy;

      await service.exchangeCode('test_auth_code#_');

      const calledBody = fetchSpy.mock.calls[0][1].body as URLSearchParams;
      expect(calledBody.get('code')).toBe('test_auth_code');
    });

    it('should return mock token response directly if code starts with mock_', async () => {
      const result = await service.exchangeCode('mock_code_xyz');
      expect(result.accessToken).toBe('mock_instagram_access_token_123');
      expect(result.expiresIn).toBe(5184000);
    });

    it('should ensure getAuthUrl redirect_uri and exchangeCode redirect_uri match identically after decoding', async () => {
      const authUrl = service.getAuthUrl('state_match_test');
      const parsedUrl = new URL(authUrl);
      const authRedirectUri = parsedUrl.searchParams.get('redirect_uri');

      const fetchSpy = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'short_token', expires_in: 3600 }),
      } as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'long_token', expires_in: 5184000 }),
      } as any);

      global.fetch = fetchSpy;

      await service.exchangeCode('valid_code_123');

      const calledBody = fetchSpy.mock.calls[0][1].body as URLSearchParams;
      const exchangeRedirectUri = calledBody.get('redirect_uri');

      expect(exchangeRedirectUri).toBe(authRedirectUri);
      expect(exchangeRedirectUri).toBe('http://localhost:5000/api/social/callback/instagram');
    });

    it('should use redirectUriOverride when provided from state', async () => {
      const fetchSpy = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'short_token', expires_in: 3600 }),
      } as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'long_token', expires_in: 5184000 }),
      } as any);

      global.fetch = fetchSpy;

      await service.exchangeCode(
        'valid_code_123',
        'https://rubbing-grasp-subscript.ngrok-free.dev/api/social/callback/instagram',
      );

      const calledBody = fetchSpy.mock.calls[0][1].body as URLSearchParams;
      expect(calledBody.get('redirect_uri')).toBe(
        'https://rubbing-grasp-subscript.ngrok-free.dev/api/social/callback/instagram',
      );
    });

    it('should throw InternalServerErrorException if credentials are missing on exchangeCode', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);
      delete process.env.INSTAGRAM_CLIENT_ID;
      delete process.env.INSTAGRAM_CLIENT_SECRET;

      await expect(service.exchangeCode('some_code')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw BadRequestException if token exchange fails', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error_message: 'Invalid authorization code' }),
      } as any);

      await expect(service.exchangeCode('invalid_code')).rejects.toThrow(BadRequestException);
    });
  });

  describe('fetchProfile', () => {
    it('should fetch user profile and evaluate creator account eligibility', async () => {
      const mockProfileResponse = {
        id: '1784140000000',
        username: 'test_creator',
        name: 'Test Creator',
        profile_picture_url: 'https://example.com/avatar.jpg',
        followers_count: 5200,
        account_type: 'MEDIA_CREATOR',
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfileResponse,
      } as any);

      const profile = await service.fetchProfile('valid_token');

      expect(profile.platformUserId).toBe('1784140000000');
      expect(profile.name).toBe('Test Creator');
      expect(profile.metadata?.accountType).toBe('MEDIA_CREATOR');
      expect(profile.metadata?.isLiveEligible).toBe(true);
      expect(profile.metadata?.followers).toBe(5200);
    });
  });
});
