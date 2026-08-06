import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  LiveStream,
  StreamStatus,
  StreamVisibility,
} from '../entities/livestream.entity';
import {
  StreamPlatform,
  StreamPlatformStatus,
} from '../../stream-platforms/entities/stream-platform.entity';
import { ConnectedAccount } from '../../social/entities/connected-account.entity';
import { OAuthToken } from '../../social/entities/oauth-token.entity';
import { ActivityLog } from '../../users/entities/activity-log.entity';
import { CreateStreamDto, UpdateStreamDto } from '../dto/livestream.dto';
import { UsageLimitService } from '../../subscriptions/services/usage-limit.service';
import { LoggerServiceWrapper } from '../../logger/logger.service';
import { LiveStreamGateway } from '../gateways/livestream.gateway';
import { decrypt } from '../../social/utils/crypto.helper';
import { calculateStreamDuration } from '../helpers/stream-duration.helper';

// Events
import { StreamCreatedEvent } from '../events/stream-created.event';
import { StreamScheduledEvent } from '../events/stream-scheduled.event';
import { StreamStartedEvent } from '../events/stream-started.event';
import { StreamStoppedEvent } from '../events/stream-stopped.event';
import { StreamEndedEvent } from '../events/stream-ended.event';
import { StreamFailedEvent } from '../events/stream-failed.event';
import { PlatformFailedEvent } from '../events/platform-failed.event';

// Adapters
import { YoutubeAdapter } from '../adapters/youtube.adapter';
import { FacebookAdapter } from '../adapters/facebook.adapter';
import { TwitchAdapter } from '../adapters/twitch.adapter';
import { LinkedinAdapter } from '../adapters/linkedin.adapter';
import { PlatformAdapter } from '../interfaces/platform-adapter.interface';

@Injectable()
export class LiveStreamsService {
  constructor(
    @InjectRepository(LiveStream)
    private readonly streamRepository: Repository<LiveStream>,
    @InjectRepository(StreamPlatform)
    private readonly streamPlatformRepository: Repository<StreamPlatform>,
    @InjectRepository(ConnectedAccount)
    private readonly accountRepository: Repository<ConnectedAccount>,
    @InjectRepository(OAuthToken)
    private readonly tokenRepository: Repository<OAuthToken>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    private readonly usageLimitService: UsageLimitService,
    private readonly loggerService: LoggerServiceWrapper,
    private readonly streamGateway: LiveStreamGateway,
    private readonly eventEmitter: EventEmitter2,

    // Inject Adapters
    private readonly youtubeAdapter: YoutubeAdapter,
    private readonly facebookAdapter: FacebookAdapter,
    private readonly twitchAdapter: TwitchAdapter,
    private readonly linkedinAdapter: LinkedinAdapter,
  ) {}

  private getPlatformAdapter(platformName: string): PlatformAdapter {
    const p = platformName.toUpperCase();
    if (p === 'YOUTUBE') return this.youtubeAdapter;
    if (p === 'FACEBOOK') return this.facebookAdapter;
    if (p === 'TWITCH') return this.twitchAdapter;
    if (p === 'LINKEDIN') return this.linkedinAdapter;
    throw new BadRequestException(
      `No live stream adapter implemented for platform: ${platformName}`,
    );
  }

  async createStream(
    workspaceId: string,
    userId: string,
    dto: CreateStreamDto,
  ): Promise<LiveStream> {
    // 1. Check stream creation limit
    const allowed = await this.usageLimitService.canCreateStream(userId);
    if (!allowed) {
      throw new BadRequestException(
        'Workspace live stream limit reached. Please upgrade your plan.',
      );
    }

    // 2. Validate connected accounts belong to workspace
    const accountIds = dto.connectedAccountIds || dto.platformAccountIds || [];
    let accounts: ConnectedAccount[] = [];
    if (accountIds.length > 0) {
      accounts = await this.accountRepository.find({
        where: { id: In(accountIds), workspaceId },
      });
      if (accounts.length !== accountIds.length) {
        throw new BadRequestException(
          'Selected connected accounts are invalid for this workspace.',
        );
      }
    }

    // 3. Create LiveStream entity (DRAFT status)
    let scheduledAtDate: Date | undefined;
    if (dto.scheduledAt) {
      scheduledAtDate = new Date(dto.scheduledAt);
      if (scheduledAtDate <= new Date()) {
        throw new BadRequestException('Scheduled time must be in the future.');
      }
    }

    const stream = this.streamRepository.create({
      workspaceId,
      title: dto.title,
      description: dto.description,
      thumbnail: dto.thumbnail,
      visibility: dto.visibility || StreamVisibility.PUBLIC,
      scheduledAt: scheduledAtDate,
      status: scheduledAtDate ? StreamStatus.SCHEDULED : StreamStatus.DRAFT,
      createdBy: userId,
    });
    await this.streamRepository.save(stream);

    // 4. Create StreamPlatform entities
    if (accounts.length > 0) {
      const streamPlatforms = accounts.map((acc) =>
        this.streamPlatformRepository.create({
          streamId: stream.id,
          connectedAccountId: acc.id,
          status: StreamPlatformStatus.PENDING,
        }),
      );
      await this.streamPlatformRepository.save(streamPlatforms);
    }

    // 5. Log activity & publish domain event
    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId,
        action: 'STREAM_CREATED',
        metadata: { workspaceId, streamId: stream.id, title: stream.title },
      }),
    );

    this.eventEmitter.emit(
      'stream.created',
      new StreamCreatedEvent(stream.id, workspaceId, userId, stream.title),
    );

    if (scheduledAtDate) {
      this.eventEmitter.emit(
        'stream.scheduled',
        new StreamScheduledEvent(
          stream.id,
          workspaceId,
          userId,
          scheduledAtDate,
        ),
      );
    }

    return this.getStreamDetails(stream.id, workspaceId);
  }

  async updateStream(
    id: string,
    workspaceId: string,
    userId: string,
    dto: UpdateStreamDto,
  ): Promise<LiveStream> {
    const stream = await this.streamRepository.findOne({
      where: { id, workspaceId },
    });
    if (!stream) {
      throw new NotFoundException('Live stream not found');
    }

    if (dto.title) stream.title = dto.title;
    if (dto.description !== undefined) stream.description = dto.description;
    if (dto.thumbnail !== undefined) {
      stream.thumbnail = dto.thumbnail;
      await this.activityLogRepository.save(
        this.activityLogRepository.create({
          userId,
          action: 'CHANGED_THUMBNAIL',
          metadata: { workspaceId, streamId: id, thumbnail: dto.thumbnail },
        }),
      );
    }
    if (dto.visibility) stream.visibility = dto.visibility;
    if (dto.scheduledAt) {
      const date = new Date(dto.scheduledAt);
      if (date <= new Date()) {
        throw new BadRequestException('Scheduled date must be in the future.');
      }
      stream.scheduledAt = date;
      stream.status = StreamStatus.SCHEDULED;

      this.eventEmitter.emit(
        'stream.scheduled',
        new StreamScheduledEvent(stream.id, workspaceId, userId, date),
      );
    }

    await this.streamRepository.save(stream);

    // Update platform mappings if specified
    const updateAccountIds = dto.connectedAccountIds || dto.platformAccountIds;
    if (updateAccountIds) {
      const accounts = await this.accountRepository.find({
        where: { id: In(updateAccountIds), workspaceId },
      });
      if (accounts.length !== updateAccountIds.length) {
        throw new BadRequestException(
          'Selected connected accounts are invalid.',
        );
      }
      // Remove old platform stream details
      await this.streamPlatformRepository.delete({ streamId: id });
      // Create new platform stream details
      const newMappings = accounts.map((acc) =>
        this.streamPlatformRepository.create({
          streamId: id,
          connectedAccountId: acc.id,
          status: StreamPlatformStatus.PENDING,
        }),
      );
      await this.streamPlatformRepository.save(newMappings);
    }

    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId,
        action: 'STREAM_UPDATED',
        metadata: { workspaceId, streamId: id, title: stream.title },
      }),
    );

    return this.getStreamDetails(id, workspaceId);
  }

  async softDeleteStream(
    id: string,
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const stream = await this.streamRepository.findOne({
      where: { id, workspaceId },
    });
    if (!stream) {
      throw new NotFoundException('Live stream not found');
    }
    await this.streamRepository.softDelete(id);
    await this.streamPlatformRepository.softDelete({ streamId: id });

    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId,
        action: 'STREAM_DELETED',
        metadata: { workspaceId, streamId: id, title: stream.title },
      }),
    );
  }

  async scheduleStream(
    id: string,
    workspaceId: string,
    userId: string,
    scheduledAt: Date,
  ): Promise<LiveStream> {
    const stream = await this.streamRepository.findOne({
      where: { id, workspaceId },
    });
    if (!stream) {
      throw new NotFoundException('Live stream not found');
    }

    if (scheduledAt <= new Date()) {
      throw new BadRequestException('Scheduled time must be in the future.');
    }

    stream.scheduledAt = scheduledAt;
    stream.status = StreamStatus.SCHEDULED;
    await this.streamRepository.save(stream);

    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId,
        action: 'STREAM_SCHEDULED',
        metadata: { workspaceId, streamId: id, scheduledAt },
      }),
    );

    this.eventEmitter.emit(
      'stream.scheduled',
      new StreamScheduledEvent(id, workspaceId, userId, scheduledAt),
    );

    return this.getStreamDetails(id, workspaceId);
  }

  async startStream(
    id: string,
    workspaceId?: string,
    userId?: string,
  ): Promise<LiveStream> {
    const where: FindOptionsWhere<LiveStream> = { id };
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }
    const stream = await this.streamRepository.findOne({
      where,
      relations: { platforms: { connectedAccount: true } },
    });
    if (!stream) {
      throw new NotFoundException('Live stream not found');
    }

    if (stream.status === StreamStatus.LIVE) {
      throw new BadRequestException('Stream is already live.');
    }

    stream.status = StreamStatus.LIVE;
    stream.startedAt = new Date();
    await this.streamRepository.save(stream);

    const platforms: StreamPlatform[] = stream.platforms || [];

    let successCount = 0;

    // Call adapters to go live on each select platform destination
    for (const mapping of platforms) {
      const platformName = mapping.connectedAccount?.platformName || 'UNKNOWN';
      try {
        const token = await this.tokenRepository.findOne({
          where: { connectedAccountId: mapping.connectedAccountId },
        });
        if (!token) {
          throw new Error(
            'OAuth credentials missing for this connected destination.',
          );
        }

        let decryptedAccessToken = token.accessToken;
        if (token.accessToken && token.accessToken.includes(':')) {
          try {
            decryptedAccessToken = decrypt(token.accessToken);
          } catch {
            decryptedAccessToken = token.accessToken;
          }
        }

        const adapter = this.getPlatformAdapter(platformName);

        // 1. Create remote broadcast
        const broadcast = await adapter.createBroadcast(
          decryptedAccessToken,
          stream.title,
          stream.description,
        );

        // 2. Transition broadcast to live state
        await adapter.startBroadcast(
          decryptedAccessToken,
          broadcast.platformStreamId,
        );

        // 3. Save ingestion endpoints
        mapping.platformStreamId = broadcast.platformStreamId;
        mapping.streamUrl = broadcast.streamUrl;
        mapping.streamKey = broadcast.streamKey;
        mapping.status = StreamPlatformStatus.LIVE;
        await this.streamPlatformRepository.save(mapping);
        successCount++;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const accountName = mapping.connectedAccount?.name || 'Destination';
        this.loggerService.warn(
          `Failed to start broadcast on platform ${accountName}: ${errMsg}`,
          'LiveStreamsService',
          'application',
        );
        mapping.status = StreamPlatformStatus.FAILED;
        await this.streamPlatformRepository.save(mapping);

        this.eventEmitter.emit(
          'platform.failed',
          new PlatformFailedEvent(id, mapping.id, platformName, errMsg),
        );
      }
    }

    // Emit live WebSockets update
    const details = platforms.map((p) => ({
      platform: p.connectedAccount?.platformName || 'UNKNOWN',
      url: p.streamUrl,
      key: p.streamKey,
      status: p.status,
    }));
    this.streamGateway.emitStreamStarted(stream.workspaceId, id, details);

    // Log Activity & Domain Event
    if (userId) {
      await this.activityLogRepository.save(
        this.activityLogRepository.create({
          userId,
          action: 'STREAM_STARTED',
          metadata: {
            workspaceId: stream.workspaceId,
            streamId: id,
            platformsCount: platforms.length,
            activePlatformsCount: successCount,
          },
        }),
      );

      this.eventEmitter.emit(
        'stream.started',
        new StreamStartedEvent(id, stream.workspaceId, userId, successCount),
      );
    }

    return this.getStreamDetails(id, stream.workspaceId);
  }

  async stopStream(
    id: string,
    workspaceId?: string,
    userId?: string,
  ): Promise<LiveStream> {
    const where: FindOptionsWhere<LiveStream> = { id };
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }
    const stream = await this.streamRepository.findOne({
      where,
      relations: { platforms: { connectedAccount: true } },
    });
    if (!stream) {
      throw new NotFoundException('Live stream not found');
    }

    if (stream.status !== StreamStatus.LIVE) {
      throw new BadRequestException('Live stream is not active.');
    }

    const endedAt = new Date();
    stream.status = StreamStatus.ENDED;
    stream.endedAt = endedAt;
    await this.streamRepository.save(stream);

    const { durationSeconds } = calculateStreamDuration(
      stream.startedAt,
      endedAt,
    );

    const platforms: StreamPlatform[] = stream.platforms || [];

    // End remote streams via adapters
    for (const mapping of platforms) {
      if (
        mapping.status === StreamPlatformStatus.LIVE &&
        mapping.platformStreamId
      ) {
        try {
          const token = await this.tokenRepository.findOne({
            where: { connectedAccountId: mapping.connectedAccountId },
          });
          if (token) {
            let decryptedAccessToken = token.accessToken;
            if (token.accessToken && token.accessToken.includes(':')) {
              try {
                decryptedAccessToken = decrypt(token.accessToken);
              } catch {
                decryptedAccessToken = token.accessToken;
              }
            }
            const platformName = mapping.connectedAccount?.platformName || '';
            const adapter = this.getPlatformAdapter(platformName);
            await adapter.stopBroadcast(
              decryptedAccessToken,
              mapping.platformStreamId,
            );
          }
          mapping.status = StreamPlatformStatus.ENDED;
          await this.streamPlatformRepository.save(mapping);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          const accountName = mapping.connectedAccount?.name || 'Destination';
          this.loggerService.warn(
            `Failed to stop broadcast on platform ${accountName}: ${errMsg}`,
            'LiveStreamsService',
            'application',
          );
        }
      }
    }

    // WebSocket update
    this.streamGateway.emitStreamStopped(stream.workspaceId, id);
    this.streamGateway.emitStreamEnded(stream.workspaceId, id);

    // Log Activity & Domain Events
    if (userId) {
      await this.activityLogRepository.save(
        this.activityLogRepository.create({
          userId,
          action: 'STREAM_STOPPED',
          metadata: {
            workspaceId: stream.workspaceId,
            streamId: id,
            durationSeconds,
          },
        }),
      );

      this.eventEmitter.emit(
        'stream.stopped',
        new StreamStoppedEvent(id, stream.workspaceId, userId, durationSeconds),
      );
    }

    this.eventEmitter.emit(
      'stream.ended',
      new StreamEndedEvent(id, stream.workspaceId, endedAt),
    );

    return this.getStreamDetails(id, stream.workspaceId);
  }

  async getHistory(workspaceId: string): Promise<LiveStream[]> {
    return this.streamRepository.find({
      where: {
        workspaceId,
        status: In([StreamStatus.ENDED, StreamStatus.CANCELLED]),
      },
      relations: { platforms: { connectedAccount: true } },
      order: { endedAt: 'DESC' },
    });
  }

  async getDashboardStats(workspaceId: string) {
    const scheduled = await this.streamRepository.count({
      where: { workspaceId, status: StreamStatus.SCHEDULED },
    });
    const live = await this.streamRepository.count({
      where: { workspaceId, status: StreamStatus.LIVE },
    });
    const completed = await this.streamRepository.count({
      where: { workspaceId, status: StreamStatus.ENDED },
    });

    // Count failed destinations
    const failedCount = await this.streamPlatformRepository.count({
      where: {
        status: StreamPlatformStatus.FAILED,
        liveStream: { workspaceId },
      },
    });

    return {
      scheduled,
      live,
      completed,
      failed: failedCount,
    };
  }

  async getStreamDetails(
    id: string,
    workspaceId?: string,
  ): Promise<LiveStream> {
    const where: FindOptionsWhere<LiveStream> = { id };
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    const stream = await this.streamRepository.findOne({
      where,
      relations: { platforms: { connectedAccount: true } },
    });
    if (!stream) {
      throw new NotFoundException('Live stream not found');
    }
    return stream;
  }

  async startScheduledStreamsBackground(): Promise<void> {
    const now = new Date();
    const scheduled = await this.streamRepository.find({
      where: {
        status: StreamStatus.SCHEDULED,
        scheduledAt: LessThanOrEqual(now),
      },
    });

    for (const stream of scheduled) {
      try {
        this.loggerService.log(
          `Auto-starting scheduled stream: "${stream.title}" (ID: ${stream.id})`,
          'LiveStreamsService',
          'application',
        );
        await this.startStream(stream.id, stream.workspaceId, stream.createdBy);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.loggerService.warn(
          `Auto-starting stream ID ${stream.id} failed: ${errMsg}`,
          'LiveStreamsService',
          'application',
        );
        stream.status = StreamStatus.DRAFT;
        await this.streamRepository.save(stream);

        this.eventEmitter.emit(
          'stream.failed',
          new StreamFailedEvent(stream.id, stream.workspaceId, errMsg),
        );
      }
    }
  }
}
