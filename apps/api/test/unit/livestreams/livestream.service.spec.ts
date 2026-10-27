import { Test, TestingModule } from '@nestjs/testing';
import { LiveStreamsService } from '../../../src/livestreams/services/livestreams.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  LiveStream,
  StreamStatus,
} from '../../../src/livestreams/entities/livestream.entity';
import {
  StreamPlatform,
  StreamPlatformStatus,
} from '../../../src/stream-platforms/entities/stream-platform.entity';
import { ConnectedAccount } from '../../../src/social/entities/connected-account.entity';
import { SocialAccount } from '../../../src/social/entities/social-account.entity';
import { OAuthToken } from '../../../src/social/entities/oauth-token.entity';
import { ActivityLog } from '../../../src/users/entities/activity-log.entity';
import { UsageLimitService } from '../../../src/subscriptions/services/usage-limit.service';
import { LoggerServiceWrapper } from '../../../src/logger/logger.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LiveStreamGateway } from '../../../src/livestreams/gateways/livestream.gateway';
import { YoutubeAdapter } from '../../../src/livestreams/adapters/youtube.adapter';
import { FacebookAdapter } from '../../../src/livestreams/adapters/facebook.adapter';
import { TwitchAdapter } from '../../../src/livestreams/adapters/twitch.adapter';
import { LinkedinAdapter } from '../../../src/livestreams/adapters/linkedin.adapter';
import { InstagramAdapter } from '../../../src/livestreams/adapters/instagram.adapter';
import { FFmpegService } from '../../../src/livestreams/services/ffmpeg.service';
import { MediaServerService } from '../../../src/livestreams/services/media-server.service';
import { createMockRepository } from '../../mocks/repository.mock';
import { createMockStream } from '../../fixtures/livestream.fixture';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { encryptGcm } from '../../../src/social/utils/crypto.helper';

describe('LiveStreamsService (Unit)', () => {
  let liveStreamsService: LiveStreamsService;
  let streamRepo: any;
  let platformRepo: any;
  let ffmpegService: any;
  let instagramAdapter: any;
  let gateway: any;
  let activityLogRepo: any;
  let tokenRepo: any;

  beforeEach(async () => {
    streamRepo = createMockRepository();
    platformRepo = createMockRepository();
    activityLogRepo = createMockRepository();
    tokenRepo = createMockRepository();

    ffmpegService = {
      startForwarding: jest.fn().mockReturnValue(true),
      stopForwarding: jest.fn(),
      isForwarding: jest.fn().mockReturnValue(false),
      getTransmittedChunkCount: jest.fn().mockReturnValue(42),
      isTransmittingFrames: jest.fn().mockReturnValue(true),
      getLastTransmissionTime: jest.fn().mockReturnValue(new Date()),
      getRelayDiagnostics: jest.fn().mockReturnValue({
        streamId: 'stream-1',
        pid: 1234,
        isProcessRunning: true,
        exitCode: null,
        exitSignal: null,
        framesTransmitted: true,
        transmittedChunks: 42,
        lastTransmissionTime: new Date(),
        lastRtmpError: null,
        recentStderr: [],
      }),
    };

    instagramAdapter = {
      createBroadcast: jest.fn(),
      validateIngestUrl: jest.fn().mockReturnValue(true),
      validateStreamKey: jest.fn().mockReturnValue(true),
      buildRtmpDestination: jest
        .fn()
        .mockImplementation((url, key) => `${url}${key}`),
      getProducerUrl: jest.fn().mockReturnValue('https://www.instagram.com/'),
      getProfileUrl: jest
        .fn()
        .mockImplementation((username) =>
          username ? `https://www.instagram.com/${username}/` : null,
        ),
      getViewerUrl: jest.fn().mockReturnValue(null),
      checkOfficialLiveStatus: jest.fn().mockResolvedValue({
        isLive: false,
        requiresManualConfirmation: true,
        apiPublishSupported: false,
        limitationReason: 'Live Producer confirmation required',
      }),
      getViewerAppNotice: jest
        .fn()
        .mockReturnValue(
          'Instagram Live broadcasts are viewed via your profile in the Instagram mobile app.',
        ),
    };

    gateway = {
      notifyStreamStarted: jest.fn(),
      notifyStreamStopped: jest.fn(),
      emitStreamStarted: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveStreamsService,
        { provide: getRepositoryToken(LiveStream), useValue: streamRepo },
        {
          provide: getRepositoryToken(StreamPlatform),
          useValue: platformRepo,
        },
        {
          provide: getRepositoryToken(ConnectedAccount),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(SocialAccount),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(OAuthToken),
          useValue: tokenRepo,
        },
        {
          provide: getRepositoryToken(ActivityLog),
          useValue: activityLogRepo,
        },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        {
          provide: UsageLimitService,
          useValue: { canScheduleStream: jest.fn().mockResolvedValue(true) },
        },
        {
          provide: LoggerServiceWrapper,
          useValue: {
            log: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
        {
          provide: LiveStreamGateway,
          useValue: gateway,
        },
        {
          provide: FFmpegService,
          useValue: ffmpegService,
        },
        {
          provide: MediaServerService,
          useValue: {
            createStreamSession: jest.fn().mockReturnValue({
              streamId: 'mock',
              whipEndpoint: 'http://localhost/whip',
              rtmpSourceUrl: 'rtmp://localhost/live/mock',
            }),
            closeSession: jest.fn(),
          },
        },
        { provide: YoutubeAdapter, useValue: { createBroadcast: jest.fn() } },
        { provide: FacebookAdapter, useValue: { createBroadcast: jest.fn() } },
        { provide: TwitchAdapter, useValue: { createBroadcast: jest.fn() } },
        { provide: LinkedinAdapter, useValue: { createBroadcast: jest.fn() } },
        {
          provide: InstagramAdapter,
          useValue: instagramAdapter,
        },
      ],
    }).compile();

    liveStreamsService = module.get<LiveStreamsService>(LiveStreamsService);
  });

  describe('getStreamDetails', () => {
    it('should throw NotFoundException if stream does not exist', async () => {
      streamRepo.findOne.mockResolvedValue(null);
      await expect(
        liveStreamsService.getStreamDetails('invalid-stream', 'ws-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return stream details and mask secret stream keys', async () => {
      const mockStream = createMockStream({
        platforms: [
          {
            id: 'plat-ig-1',
            platform: 'INSTAGRAM',
            streamKey: 'raw_super_secret_stream_key',
            streamUrl: 'rtmps://live-upload.instagram.com:443/rtmp/',
            status: 'READY',
            connectedAccount: { platformName: 'INSTAGRAM' },
          },
        ],
      });
      streamRepo.findOne.mockResolvedValue(mockStream);
      const res = await liveStreamsService.getStreamDetails(
        mockStream.id,
        mockStream.workspaceId,
      );
      expect(res.id).toBe(mockStream.id);
      expect(res.platforms[0].streamKey).toBe('••••••••••••••••');
    });
  });

  describe('Instagram Live Producer Ingest Workflow', () => {
    const mockPlatform: Partial<StreamPlatform> = {
      id: 'plat-ig-1',
      streamId: 'stream-1',
      platform: 'INSTAGRAM',
      streamUrl: 'rtmps://live-upload.instagram.com:443/rtmp/',
      streamKey: 'AQB3x9Y_encrypted_or_plain',
      status: 'READY',
      sourceStatus: 'DISCONNECTED',
      ingestMode: 'LIVE_PRODUCER',
      connectedAccount: {
        id: 'acc-1',
        platformName: 'INSTAGRAM',
        username: 'test_ig_user',
      } as any,
    };

    const mockStream = createMockStream({
      id: 'stream-1',
      workspaceId: 'ws-1',
      platforms: [mockPlatform],
    });

    describe('configureInstagramSource', () => {
      it('should throw NotFoundException if stream or platform not found', async () => {
        streamRepo.findOne.mockResolvedValue(null);
        await expect(
          liveStreamsService.configureInstagramSource(
            'stream-x',
            'ws-1',
            'user-1',
            {
              platformId: 'plat-ig-1',
              streamKey: 'AQB3x9Y_valid_key',
            },
          ),
        ).rejects.toThrow(NotFoundException);
      });

      it('should reject invalid stream keys', async () => {
        streamRepo.findOne.mockResolvedValue(mockStream);
        instagramAdapter.validateStreamKey.mockReturnValue(false);

        await expect(
          liveStreamsService.configureInstagramSource(
            'stream-1',
            'ws-1',
            'user-1',
            {
              platformId: 'plat-ig-1',
              streamKey: 'short',
            },
          ),
        ).rejects.toThrow(BadRequestException);
      });

      it('should reject SSRF / invalid ingest URLs', async () => {
        streamRepo.findOne.mockResolvedValue(mockStream);
        instagramAdapter.validateStreamKey.mockReturnValue(true);
        instagramAdapter.validateIngestUrl.mockReturnValue(false);

        await expect(
          liveStreamsService.configureInstagramSource(
            'stream-1',
            'ws-1',
            'user-1',
            {
              platformId: 'plat-ig-1',
              streamKey: 'AQB3x9Y_valid_key',
              streamUrl: 'rtmp://127.0.0.1/malicious',
            },
          ),
        ).rejects.toThrow(BadRequestException);
      });

      it('should securely encrypt stream key with AES-256-GCM and update platform', async () => {
        streamRepo.findOne.mockResolvedValue(mockStream);
        instagramAdapter.validateStreamKey.mockReturnValue(true);
        instagramAdapter.validateIngestUrl.mockReturnValue(true);

        const result = await liveStreamsService.configureInstagramSource(
          'stream-1',
          'ws-1',
          'user-1',
          {
            platformId: 'plat-ig-1',
            streamKey: 'AQB3x9Y_valid_key_12345',
            streamUrl: 'rtmps://live-upload.instagram.com:443/rtmp/',
          },
        );

        expect(result.success).toBe(true);
        expect(result.sourceConnected).toBe(true);
        expect(result.producerUrl).toBe('https://www.instagram.com/');
        expect(platformRepo.save).toHaveBeenCalled();
        const savedPlatform = platformRepo.save.mock.calls[0][0];
        expect(savedPlatform.streamKey.startsWith('gcm:')).toBe(true);
        expect(savedPlatform.status).toBe(StreamPlatformStatus.CONFIGURED);
        expect(savedPlatform.sourceStatus).toBe('CONNECTED');
        expect(savedPlatform.ingestMode).toBe('LIVE_PRODUCER');
      });
    });

    describe('startInstagramOutput', () => {
      it('should throw BadRequestException if stream key is not configured', async () => {
        const unconfiguredPlatform = {
          ...mockPlatform,
          streamKey: '',
        };
        const streamWithoutKey = createMockStream({
          id: 'stream-1',
          workspaceId: 'ws-1',
          platforms: [unconfiguredPlatform],
        });
        streamRepo.findOne.mockResolvedValue(streamWithoutKey);

        await expect(
          liveStreamsService.startInstagramOutput(
            'stream-1',
            'ws-1',
            'user-1',
            'plat-ig-1',
          ),
        ).rejects.toThrow(BadRequestException);
      });

      it('should decrypt key in memory and start FFmpeg relay with 9:16 vertical profile', async () => {
        const rawKey = 'AQB3x9Y_secret_key_to_relay';
        const encryptedKey = encryptGcm(rawKey);

        const readyPlatform = {
          ...mockPlatform,
          streamKey: encryptedKey,
        };
        const streamWithKey = createMockStream({
          id: 'stream-1',
          workspaceId: 'ws-1',
          platforms: [readyPlatform],
        });
        streamRepo.findOne.mockResolvedValue(streamWithKey);

        const res = await liveStreamsService.startInstagramOutput(
          'stream-1',
          'ws-1',
          'user-1',
          'plat-ig-1',
        );

        expect(res.success).toBe(true);
        expect(res.isRelayActive).toBe(true);
        expect(res.producerUrl).toBe('https://www.instagram.com/');
        expect(ffmpegService.startForwarding).toHaveBeenCalled();

        const forwardingArgs = ffmpegService.startForwarding.mock.calls[0];
        expect(forwardingArgs[0]).toEqual({
          streamId: 'stream-1',
          sourceUrl: 'pipe:0',
          destinationUrl: 'rtmps://live-upload.instagram.com:443/rtmp/',
          streamKey: rawKey,
          platform: 'INSTAGRAM',
        });

        expect(platformRepo.save).toHaveBeenCalled();
        const savedPlatform = platformRepo.save.mock.calls[0][0];
        expect(savedPlatform.sourceStatus).toBe('TRANSMITTING');
        expect(savedPlatform.status).toBe(
          StreamPlatformStatus.WAITING_FOR_INSTAGRAM_CONFIRMATION,
        );
      });

      it('should prevent starting duplicate FFmpeg relays if already transmitting', async () => {
        ffmpegService.isForwarding.mockReturnValue(true);
        const streamWithKey = createMockStream({
          id: 'stream-1',
          workspaceId: 'ws-1',
          platforms: [mockPlatform],
        });
        streamRepo.findOne.mockResolvedValue(streamWithKey);

        const res = await liveStreamsService.startInstagramOutput(
          'stream-1',
          'ws-1',
          'user-1',
          'plat-ig-1',
        );

        expect(res.success).toBe(true);
        expect(res.message).toContain('Your video is reaching Instagram');
        expect(ffmpegService.startForwarding).not.toHaveBeenCalled();
      });

      it('should reject personal Instagram accounts with ACCOUNT_INELIGIBLE_PERSONAL', async () => {
        const rawKey = 'AQB3x9Y_valid_key_12345';
        const encryptedKey = encryptGcm(rawKey);

        const personalPlatform = {
          ...mockPlatform,
          streamKey: encryptedKey,
          connectedAccount: {
            id: 'acc-ig-personal',
            platformName: 'INSTAGRAM',
            platformUserId: 'ig_user_personal',
            metadata: { accountType: 'PERSONAL' },
          },
        };
        const streamWithPersonal = createMockStream({
          id: 'stream-1',
          workspaceId: 'ws-1',
          platforms: [personalPlatform],
        });
        streamRepo.findOne.mockResolvedValue(streamWithPersonal);

        await expect(
          liveStreamsService.startInstagramOutput(
            'stream-1',
            'ws-1',
            'user-1',
            'plat-ig-1',
          ),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('stopInstagramOutput', () => {
      it('should stop FFmpeg relay and set platform status to ENDED with explicit caller and reason', async () => {
        streamRepo.findOne.mockResolvedValue(mockStream);

        const res = await liveStreamsService.stopInstagramOutput(
          'stream-1',
          'ws-1',
          'user-1',
          'plat-ig-1',
        );

        expect(res.success).toBe(true);
        expect(ffmpegService.stopForwarding).toHaveBeenCalledWith(
          'stream-1',
          expect.any(String),
          'user_stopped_instagram_output',
          'stopInstagramOutput',
        );
        expect(platformRepo.save).toHaveBeenCalled();
        const saved = platformRepo.save.mock.calls[0][0];
        expect(saved.status).toBe('ENDED');
        expect(saved.sourceStatus).toBe('DISCONNECTED');
      });
    });

    describe('confirmInstagramLive', () => {
      it('should reject confirmation if transmission is not active', async () => {
        const notTransmittingPlatform = {
          ...mockPlatform,
          sourceStatus: 'DISCONNECTED',
          status: StreamPlatformStatus.CONFIGURED,
        };
        const streamNotTransmitting = createMockStream({
          id: 'stream-1',
          workspaceId: 'ws-1',
          platforms: [notTransmittingPlatform],
        });
        streamRepo.findOne.mockResolvedValue(streamNotTransmitting);
        ffmpegService.isForwarding.mockReturnValue(false);

        await expect(
          liveStreamsService.confirmInstagramLive(
            'stream-1',
            'ws-1',
            'user-1',
            'plat-ig-1',
          ),
        ).rejects.toThrow(BadRequestException);
      });

      it('should preserve relay and keep WAITING_FOR_INSTAGRAM_CONFIRMATION if unverified without manual confirmation', async () => {
        const transmittingPlatform = {
          ...mockPlatform,
          sourceStatus: 'TRANSMITTING',
          status: StreamPlatformStatus.WAITING_FOR_INSTAGRAM_CONFIRMATION,
        };
        const streamTransmitting = createMockStream({
          id: 'stream-1',
          workspaceId: 'ws-1',
          platforms: [transmittingPlatform],
        });
        streamRepo.findOne.mockResolvedValue(streamTransmitting);
        ffmpegService.isForwarding.mockReturnValue(true);
        (ffmpegService.isTransmittingFrames as jest.Mock).mockReturnValue(true);
        (ffmpegService.getTransmittedChunkCount as jest.Mock).mockReturnValue(
          42,
        );

        const res = await liveStreamsService.confirmInstagramLive(
          'stream-1',
          'ws-1',
          'user-1',
          'plat-ig-1',
          false, // manualConfirmed = false
        );

        expect(res.success).toBe(true);
        expect(res.isLive).toBe(false);
        expect(res.isRelayActive).toBe(true);
        expect(res.status).toBe(
          StreamPlatformStatus.WAITING_FOR_INSTAGRAM_CONFIRMATION,
        );
        expect(res.verificationStatus).toBe('STATUS_UNVERIFIED');
        expect(res.requiresManualConfirmation).toBe(true);
        expect(ffmpegService.stopForwarding).not.toHaveBeenCalled();

        // Database status should NOT become LIVE blindly
        expect(platformRepo.save).toHaveBeenCalled();
        const savedPlat = platformRepo.save.mock.calls[0][0];
        expect(savedPlat.status).toBe(
          StreamPlatformStatus.WAITING_FOR_INSTAGRAM_CONFIRMATION,
        );
        expect(savedPlat.sourceStatus).toBe('TRANSMITTING');
      });

      it('should NOT falsely mark as LIVE on button click alone and preserve relay as WAITING_FOR_INSTAGRAM_CONFIRMATION when unverified by platform', async () => {
        const transmittingPlatform = {
          ...mockPlatform,
          sourceStatus: 'TRANSMITTING',
          status: StreamPlatformStatus.WAITING_FOR_INSTAGRAM_CONFIRMATION,
        };
        const streamTransmitting = createMockStream({
          id: 'stream-1',
          workspaceId: 'ws-1',
          platforms: [transmittingPlatform],
        });
        streamRepo.findOne.mockResolvedValue(streamTransmitting);
        ffmpegService.isForwarding.mockReturnValue(true);
        (ffmpegService.isTransmittingFrames as jest.Mock).mockReturnValue(true);
        // Instagram adapter returns not live (no active broadcast in Live Producer)
        (
          instagramAdapter.checkOfficialLiveStatus as jest.Mock
        ).mockResolvedValue({
          isLive: false,
          requiresManualConfirmation: true,
          apiPublishSupported: false,
          limitationReason: 'No active broadcast on Instagram',
        });

        const res = await liveStreamsService.confirmInstagramLive(
          'stream-1',
          'ws-1',
          'user-1',
          'plat-ig-1',
          true, // manualConfirmed clicked by user
        );

        // Crucial fix: must NOT become live blindly
        expect(res.success).toBe(true);
        expect(res.isLive).toBe(false);
        expect(res.status).toBe(
          StreamPlatformStatus.WAITING_FOR_INSTAGRAM_CONFIRMATION,
        );
        expect(res.verificationStatus).toBe('WAITING_FOR_MANUAL_CONFIRMATION');
        expect(res.isRelayActive).toBe(true);
        expect(ffmpegService.stopForwarding).not.toHaveBeenCalled();

        expect(platformRepo.save).toHaveBeenCalled();
        const savedPlat = platformRepo.save.mock.calls[0][0];
        expect(savedPlat.status).toBe(
          StreamPlatformStatus.WAITING_FOR_INSTAGRAM_CONFIRMATION,
        );
        expect(savedPlat.sourceStatus).toBe('TRANSMITTING');
      });

      it('should identify simulated/mock accounts, preserve relay, and return VERIFICATION_UNAVAILABLE', async () => {
        const mockIgPlatform = {
          ...mockPlatform,
          connectedAccountId: 'acc-ig-mock',
          connectedAccount: {
            id: 'acc-ig-mock',
            platformName: 'INSTAGRAM',
            platformUserId: 'mock_ig_user_101',
            name: 'Mock IG User 101',
            metadata: { isMock: true, accountType: 'MOCK' },
          },
          sourceStatus: 'TRANSMITTING',
          status: StreamPlatformStatus.WAITING_FOR_INSTAGRAM_CONFIRMATION,
        };
        const streamMock = createMockStream({
          id: 'stream-1',
          workspaceId: 'ws-1',
          platforms: [mockIgPlatform],
        });
        streamRepo.findOne.mockResolvedValue(streamMock);
        tokenRepo.findOne.mockResolvedValue({
          accessToken: 'mock_token_101',
          connectedAccountId: 'acc-ig-mock',
        });
        ffmpegService.isForwarding.mockReturnValue(true);

        const res = await liveStreamsService.confirmInstagramLive(
          'stream-1',
          'ws-1',
          'user-1',
          'plat-ig-1',
          true,
        );

        expect(res.success).toBe(true);
        expect(res.isLive).toBe(false);
        expect(res.isMockAccount).toBe(true);
        expect(res.verificationStatus).toBe('VERIFICATION_UNAVAILABLE');
        expect(res.isRelayActive).toBe(true);
        expect(res.status).toBe(
          StreamPlatformStatus.WAITING_FOR_INSTAGRAM_CONFIRMATION,
        );
        expect(ffmpegService.stopForwarding).not.toHaveBeenCalled();
      });

      it('should transition stream and platform to LIVE only when official Meta Graph API verifies an active broadcast', async () => {
        const transmittingPlatform = {
          ...mockPlatform,
          connectedAccountId: 'acc-ig-1',
          connectedAccount: {
            id: 'acc-ig-1',
            platformName: 'INSTAGRAM',
            platformUserId: 'ig_user_123',
            username: 'test_ig_user',
            name: 'Test Instagram Account',
          },
          sourceStatus: 'TRANSMITTING',
          status: StreamPlatformStatus.WAITING_FOR_INSTAGRAM_CONFIRMATION,
        };
        const streamTransmitting = createMockStream({
          id: 'stream-1',
          workspaceId: 'ws-1',
          platforms: [transmittingPlatform],
        });
        streamRepo.findOne.mockResolvedValue(streamTransmitting);
        tokenRepo.findOne.mockResolvedValue({
          accessToken: 'valid_meta_token_123',
          connectedAccountId: 'acc-ig-1',
        });
        ffmpegService.isForwarding.mockReturnValue(true);
        (ffmpegService.isTransmittingFrames as jest.Mock).mockReturnValue(true);

        // Instagram adapter returns verified active broadcast from Meta
        (
          instagramAdapter.checkOfficialLiveStatus as jest.Mock
        ).mockResolvedValue({
          isLive: true,
          liveMediaId: 'live_media_10928374',
          requiresManualConfirmation: false,
          apiPublishSupported: false,
        });

        const res = await liveStreamsService.confirmInstagramLive(
          'stream-1',
          'ws-1',
          'user-1',
          'plat-ig-1',
          true,
        );

        expect(res.success).toBe(true);
        expect(res.isLive).toBe(true);
        expect(res.status).toBe(StreamStatus.LIVE);
        expect(res.verificationStatus).toBe('LIVE_VERIFIED');
        expect(res.isRelayActive).toBe(true);
        expect(res.producerUrl).toBe('https://www.instagram.com/');
        expect(res.profileUrl).toBe('https://www.instagram.com/test_ig_user/');
        expect(ffmpegService.stopForwarding).not.toHaveBeenCalled();

        expect(platformRepo.save).toHaveBeenCalled();
        const savedPlat = platformRepo.save.mock.calls[0][0];
        expect(savedPlat.status).toBe(StreamStatus.LIVE);
        expect(savedPlat.sourceStatus).toBe('TRANSMITTING'); // Keeps transmitting!
        expect(savedPlat.publishedAt).toBeDefined();

        expect(streamRepo.save).toHaveBeenCalled();
        const savedStream = streamRepo.save.mock.calls[0][0];
        expect(savedStream.status).toBe(StreamStatus.LIVE);

        expect(gateway.emitStreamStarted).toHaveBeenCalled();
      });

      it('should handle duplicate confirmation requests safely and idempotently without stopping relay', async () => {
        const livePlatform = {
          ...mockPlatform,
          connectedAccountId: 'acc-ig-1',
          connectedAccount: {
            id: 'acc-ig-1',
            platformName: 'INSTAGRAM',
            platformUserId: 'ig_user_123',
            name: 'Test Instagram Account',
          },
          sourceStatus: 'TRANSMITTING',
          status: StreamPlatformStatus.LIVE,
        };
        const streamLive = createMockStream({
          id: 'stream-1',
          workspaceId: 'ws-1',
          status: StreamStatus.LIVE,
          platforms: [livePlatform],
        });
        streamRepo.findOne.mockResolvedValue(streamLive);
        tokenRepo.findOne.mockResolvedValue({
          accessToken: 'valid_meta_token_123',
          connectedAccountId: 'acc-ig-1',
        });
        ffmpegService.isForwarding.mockReturnValue(true);

        (
          instagramAdapter.checkOfficialLiveStatus as jest.Mock
        ).mockResolvedValue({
          isLive: true,
          liveMediaId: 'live_media_10928374',
          requiresManualConfirmation: false,
          apiPublishSupported: false,
        });

        const res = await liveStreamsService.confirmInstagramLive(
          'stream-1',
          'ws-1',
          'user-1',
          'plat-ig-1',
          true,
        );

        expect(res.success).toBe(true);
        expect(res.isRelayActive).toBe(true);
        expect(ffmpegService.stopForwarding).not.toHaveBeenCalled();
      });
    });

    describe('getInstagramWorkflowStatus', () => {
      it('should return safe status without leaking stream key or tokens', async () => {
        const transmittingPlatform = {
          ...mockPlatform,
          sourceStatus: 'TRANSMITTING',
          status: StreamPlatformStatus.WAITING_FOR_INSTAGRAM_CONFIRMATION,
        };
        const streamTransmitting = createMockStream({
          id: 'stream-1',
          workspaceId: 'ws-1',
          platforms: [transmittingPlatform],
        });
        streamRepo.findOne.mockResolvedValue(streamTransmitting);
        ffmpegService.isForwarding.mockReturnValue(true);

        const status = await liveStreamsService.getInstagramWorkflowStatus(
          'stream-1',
          'ws-1',
          'plat-ig-1',
        );

        expect(status.platformId).toBe('plat-ig-1');
        expect(status.isRelayActive).toBe(true);
        expect(status.sourceConnected).toBe(true);
        expect(status.effectiveStatus).toBe(
          StreamPlatformStatus.WAITING_FOR_INSTAGRAM_CONFIRMATION,
        );
        expect(status.producerUrl).toBe('https://www.instagram.com/');
        expect(status.hasVerifiedViewerUrl).toBe(false);
        expect(status.profileUrl).toBe(
          'https://www.instagram.com/test_ig_user/',
        );
        expect(status.framesTransmitted).toBe(true);
        expect(status.transmittedChunks).toBe(42);
        expect(status.requiresManualConfirmation).toBe(true);
        expect(status.limitationNotice).toBeDefined();
        expect(status.streamKey).toBeUndefined();
      });
    });
  });
});
