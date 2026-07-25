import { Test, TestingModule } from '@nestjs/testing';
import { LiveStreamsService } from '../../../src/livestreams/services/livestreams.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  LiveStream,
  StreamStatus,
} from '../../../src/livestreams/entities/livestream.entity';
import { StreamPlatform } from '../../../src/stream-platforms/entities/stream-platform.entity';
import { ConnectedAccount } from '../../../src/social/entities/connected-account.entity';
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
import { createMockRepository } from '../../mocks/repository.mock';
import { createMockStream } from '../../fixtures/livestream.fixture';
import { NotFoundException } from '@nestjs/common';

describe('LiveStreamsService (Unit)', () => {
  let liveStreamsService: LiveStreamsService;
  let streamRepo: any;

  beforeEach(async () => {
    streamRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveStreamsService,
        { provide: getRepositoryToken(LiveStream), useValue: streamRepo },
        {
          provide: getRepositoryToken(StreamPlatform),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(ConnectedAccount),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(OAuthToken),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(ActivityLog),
          useValue: createMockRepository(),
        },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        {
          provide: UsageLimitService,
          useValue: { canScheduleStream: jest.fn().mockResolvedValue(true) },
        },
        { provide: LoggerServiceWrapper, useValue: { log: jest.fn() } },
        {
          provide: LiveStreamGateway,
          useValue: {
            notifyStreamStarted: jest.fn(),
            notifyStreamStopped: jest.fn(),
          },
        },
        { provide: YoutubeAdapter, useValue: { createBroadcast: jest.fn() } },
        { provide: FacebookAdapter, useValue: { createBroadcast: jest.fn() } },
        { provide: TwitchAdapter, useValue: { createBroadcast: jest.fn() } },
        { provide: LinkedinAdapter, useValue: { createBroadcast: jest.fn() } },
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

    it('should return stream details when found', async () => {
      const mockStream = createMockStream();
      streamRepo.findOne.mockResolvedValue(mockStream);
      const res = await liveStreamsService.getStreamDetails(
        mockStream.id,
        mockStream.workspaceId,
      );
      expect(res.id).toBe(mockStream.id);
    });
  });
});
