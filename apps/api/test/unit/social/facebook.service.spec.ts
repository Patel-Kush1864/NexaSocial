import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FacebookService } from '../../../src/social/services/facebook.service';

describe('FacebookService', () => {
  let service: FacebookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacebookService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'oauth.facebook.appId') return '3692821807549687';
              if (key === 'oauth.facebook.appSecret') return 'test_secret';
              if (key === 'oauth.facebook.redirectUri')
                return 'http://localhost:5000/api/social/facebook/callback';
              if (key === 'oauth.facebook.graphVersion') return 'v23.0';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<FacebookService>(FacebookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate valid OAuth authorization URL with state', () => {
    const state = 'test_state_string';
    const authUrl = service.generateAuthUrl(state);

    expect(authUrl).toContain('https://www.facebook.com/v23.0/dialog/oauth');
    expect(authUrl).toContain('client_id=3692821807549687');
    expect(authUrl).toContain('state=test_state_string');
    expect(authUrl).toContain(
      encodeURIComponent('http://localhost:5000/api/social/facebook/callback'),
    );
  });

  it('should return mock token response in test mode or when code starts with mock_', async () => {
    const response = await service.exchangeCodeForToken('mock_code_123');

    expect(response.accessToken).toBeDefined();
    expect(response.expiresIn).toBe(5184000);
  });

  it('should return mock user profile for mock access token', async () => {
    const user = await service.getFacebookUser('mock_token_123');

    expect(user.id).toBeDefined();
    expect(user.name).toBe('Alex Johnson');
    expect(user.email).toBe('alex.johnson@example.com');
  });
});
