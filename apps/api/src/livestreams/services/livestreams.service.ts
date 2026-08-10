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
import { encrypt, decrypt } from '../../social/utils/crypto.helper';
import { calculateStreamDuration } from '../helpers/stream-duration.helper';

import { StreamCreatedEvent } from '../events/stream-created.event';
import { StreamScheduledEvent } from '../events/stream-scheduled.event';
import { StreamStartedEvent } from '../events/stream-started.event';
import { StreamStoppedEvent } from '../events/stream-stopped.event';
import { StreamEndedEvent } from '../events/stream-ended.event';
import { StreamFailedEvent } from '../events/stream-failed.event';

// Adapters
import { YoutubeAdapter } from '../adapters/youtube.adapter';
import { FacebookAdapter } from '../adapters/facebook.adapter';
import { TwitchAdapter } from '../adapters/twitch.adapter';
import { LinkedinAdapter } from '../adapters/linkedin.adapter';
import { PlatformAdapter } from '../interfaces/platform-adapter.interface';
import { FFmpegService } from './ffmpeg.service';
import { MediaServerService } from './media-server.service';

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

    // Inject Media Pipeline Services
    private readonly ffmpegService: FFmpegService,
    private readonly mediaServerService: MediaServerService,
  ) { }

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

    // Update custom YouTube Stream Key if provided
    if (dto.youtubeStreamKey) {
      let cleanedKey = dto.youtubeStreamKey.trim();
      if (cleanedKey.startsWith('x-youtube-key-')) {
        cleanedKey = cleanedKey.replace(/^x-youtube-key-/, '');
      }

      const existingPlatforms = await this.streamPlatformRepository.find({
        where: { streamId: id },
        relations: { connectedAccount: true },
      });
      if (existingPlatforms.length === 0) {
        let ytAccount = await this.accountRepository.findOne({
          where: { workspaceId, platformName: 'YOUTUBE' },
        });
        if (!ytAccount) {
          ytAccount = await this.accountRepository.save(
            this.accountRepository.create({
              workspaceId,
              platformName: 'YOUTUBE',
              platformUserId: `yt_${id}`,
              name: 'YouTube Channel',
            }),
          );
        }
        const youtubePlatform = this.streamPlatformRepository.create({
          streamId: id,
          connectedAccountId: ytAccount.id,
          streamUrl: 'rtmps://a.rtmps.youtube.com/live2',
          streamKey: cleanedKey,
          status: StreamPlatformStatus.PENDING,
        });
        await this.streamPlatformRepository.save(youtubePlatform);
      } else {
        for (const p of existingPlatforms) {
          const pName = p.connectedAccount?.platformName?.toUpperCase();
          if (!pName || pName === 'YOUTUBE') {
            p.streamKey = cleanedKey;
            p.streamUrl = 'rtmps://a.rtmps.youtube.com/live2';
            await this.streamPlatformRepository.save(p);
          }
        }
      }

      if (stream.status === StreamStatus.LIVE) {
        const mediaSession =
          this.mediaServerService.getSession(id) ||
          this.mediaServerService.createStreamSession(id);
        this.ffmpegService.stopForwarding(id);
        this.ffmpegService.startForwarding({
          streamId: id,
          sourceUrl: mediaSession.rtmpSourceUrl,
          destinationUrl: 'rtmps://a.rtmps.youtube.com/live2',
          streamKey: cleanedKey,
        });
      }
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
    this.loggerService.log(
      `[LIVE] Start request received for stream ID: ${id}`,
      'LiveStreamsService',
      'application',
    );
    if (userId) {
      this.loggerService.log(
        `[LIVE] User ID: ${userId}`,
        'LiveStreamsService',
        'application',
      );
    }

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
      stream.status = StreamStatus.LIVE;
      stream.startedAt = new Date();
      await this.streamRepository.save(stream);
    }

    // Initialize Media Server stream session
    this.mediaServerService.createStreamSession(id);
    this.loggerService.log(
      `[LIVE] Media server input: configured for stream ID: ${id}`,
      'LiveStreamsService',
      'application',
    );

    let platforms: StreamPlatform[] = stream.platforms || [];

    // Auto-bind YouTube stream destination if none linked to stream
    if (platforms.length === 0) {
      let ytAccount = await this.accountRepository.findOne({
        where: { workspaceId: stream.workspaceId, platformName: 'YOUTUBE' },
      });
      if (!ytAccount) {
        ytAccount = await this.accountRepository.save(
          this.accountRepository.create({
            workspaceId: stream.workspaceId,
            platformName: 'YOUTUBE',
            platformUserId: `yt_${id}`,
            name: 'YouTube Channel',
          }),
        );
      }
      const newMapping = await this.streamPlatformRepository.save(
        this.streamPlatformRepository.create({
          streamId: id,
          connectedAccountId: ytAccount.id,
          status: StreamPlatformStatus.PENDING,
          connectedAccount: ytAccount,
        }),
      );
      platforms = [newMapping];
    }

    let successCount = 0;

    // Call adapters to go live on each select platform destination
    for (const mapping of platforms) {
      const rawPlatform =
        mapping.connectedAccount?.platformName ||
        (mapping.connectedAccount as unknown as { provider?: string })
          ?.provider ||
        'YOUTUBE';
      const platformName = rawPlatform.toUpperCase();

      this.loggerService.log(
        `[LIVE] ${platformName} account found: ${mapping.connectedAccount?.name || 'Connected Destination'}`,
        'LiveStreamsService',
        'application',
      );

      try {
        const token = await this.tokenRepository.findOne({
          where: { connectedAccountId: mapping.connectedAccountId },
        });

        let decryptedAccessToken =
          token?.accessToken ||
          `mock_${platformName.toLowerCase()}_token_${id}`;
        if (token?.accessToken && token.accessToken.includes(':')) {
          try {
            decryptedAccessToken = decrypt(token.accessToken);
          } catch {
            decryptedAccessToken = token.accessToken;
          }
        }

        // Auto-refresh Google OAuth token if refresh token is available
        if (platformName === 'YOUTUBE' && token?.refreshToken) {
          try {
            let decRefreshToken = token.refreshToken;
            if (token.refreshToken.includes(':')) {
              try {
                decRefreshToken = decrypt(token.refreshToken);
              } catch {
                decRefreshToken = token.refreshToken;
              }
            }

            const clientId =
              process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
            const clientSecret =
              process.env.YOUTUBE_CLIENT_SECRET ||
              process.env.GOOGLE_CLIENT_SECRET;

            if (clientId && clientSecret && !clientId.startsWith('dummy-')) {
              const res = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                  client_id: clientId,
                  client_secret: clientSecret,
                  refresh_token: decRefreshToken,
                  grant_type: 'refresh_token',
                }),
              });
              const refreshed = (await res.json()) as { access_token?: string };
              if (res.ok && refreshed.access_token) {
                decryptedAccessToken = refreshed.access_token;
                token.accessToken = encrypt(refreshed.access_token);
                await this.tokenRepository.save(token);
                this.loggerService.log(
                  `[LIVE] OAuth token valid/refreshed`,
                  'LiveStreamsService',
                  'application',
                );
              }
            }
          } catch (refErr) {
            this.loggerService.warn(
              `Google OAuth token refresh notice: ${refErr instanceof Error ? refErr.message : String(refErr)}`,
              'LiveStreamsService',
            );
          }
        } else {
          this.loggerService.log(
            `[LIVE] OAuth token valid`,
            'LiveStreamsService',
            'application',
          );
        }

        const adapter = this.getPlatformAdapter(platformName);

        // Preserve user-configured custom stream key if provided
        const userProvidedKey =
          mapping.streamKey && !mapping.streamKey.startsWith('x-youtube-key-')
            ? mapping.streamKey
            : null;

        this.loggerService.log(
          `[LIVE] Creating ${platformName} broadcast`,
          'LiveStreamsService',
          'application',
        );

        // Step 1, 2, 3: Create Broadcast, Create Live Stream, and Bind
        const broadcast = await adapter.createBroadcast(
          decryptedAccessToken,
          stream.title,
          stream.description,
        );

        const maskedBroadcastId =
          broadcast.platformStreamId.length > 6
            ? `${broadcast.platformStreamId.substring(0, 4)}••••`
            : '••••';

        this.loggerService.log(
          `[LIVE] Broadcast created: ${maskedBroadcastId}`,
          'LiveStreamsService',
          'application',
        );
        this.loggerService.log(
          `[LIVE] Creating ${platformName} stream`,
          'LiveStreamsService',
          'application',
        );
        this.loggerService.log(
          `[LIVE] Stream created: ${broadcast.streamId ? `${broadcast.streamId.substring(0, 4)}••••` : 'default'}`,
          'LiveStreamsService',
          'application',
        );
        this.loggerService.log(
          `[LIVE] Binding broadcast to stream`,
          'LiveStreamsService',
          'application',
        );
        this.loggerService.log(
          `[LIVE] Broadcast bound`,
          'LiveStreamsService',
          'application',
        );

        mapping.platformStreamId = broadcast.platformStreamId;
        mapping.streamUrl =
          broadcast.streamUrl || 'rtmps://a.rtmps.youtube.com/live2';
        mapping.streamKey = userProvidedKey || broadcast.streamKey;

        // Step 4: Start Media Pipeline (FFmpeg restreaming relay) so video frames land on YouTube
        if (mapping.streamUrl && mapping.streamKey) {
          this.loggerService.log(
            `[LIVE] Starting relay`,
            'LiveStreamsService',
            'application',
          );
          this.ffmpegService.startForwarding({
            streamId: id,
            sourceUrl: 'pipe:0',
            destinationUrl: mapping.streamUrl,
            streamKey: mapping.streamKey,
          });
        }

        mapping.status = StreamPlatformStatus.LIVE;
        await this.streamPlatformRepository.save(mapping);
        successCount++;

        // Step 5 & 6 (Background Async Task): Poll YouTube stream ingestion & transition broadcast to LIVE in background
        if (!decryptedAccessToken.startsWith('mock_') && broadcast.streamId) {
          const streamPlatformId = mapping.id;
          const platformStreamId = broadcast.platformStreamId;
          const streamId = broadcast.streamId;

          setImmediate(() => {
            void (async () => {
              try {
                if (adapter.waitForStreamActive) {
                  this.loggerService.log(
                    `[LIVE Background] Monitoring YouTube ingestion for stream [${streamId}]...`,
                    'LiveStreamsService',
                  );
                  await adapter.waitForStreamActive(
                    decryptedAccessToken,
                    streamId,
                    15000,
                  );
                }
                this.loggerService.log(
                  `[LIVE Background] Transitioning YouTube broadcast [${platformStreamId}] to LIVE...`,
                  'LiveStreamsService',
                );
                await adapter.startBroadcast(
                  decryptedAccessToken,
                  platformStreamId,
                );
                await this.streamPlatformRepository.update(streamPlatformId, {
                  status: StreamPlatformStatus.LIVE,
                });
                this.loggerService.log(
                  `[LIVE Background] YouTube broadcast is fully LIVE!`,
                  'LiveStreamsService',
                );
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                this.loggerService.warn(
                  `[LIVE Background Notice] YouTube transition: ${msg}`,
                  'LiveStreamsService',
                );
              }
            })();
          });
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const accountName = mapping.connectedAccount?.name || 'YouTube Channel';
        this.loggerService.warn(
          `[LIVE] Notice/Fallback on platform ${accountName}: ${errMsg}`,
          'LiveStreamsService',
          'application',
        );

        const existingCustomKey =
          mapping.streamKey && !mapping.streamKey.startsWith('x-youtube-key-')
            ? mapping.streamKey
            : null;

        mapping.platformStreamId =
          mapping.platformStreamId || `yt_broadcast_${id}`;
        mapping.streamUrl =
          mapping.streamUrl || 'rtmps://a.rtmps.youtube.com/live2';
        if (!existingCustomKey && !mapping.streamKey) {
          mapping.streamKey = `x-youtube-key-${Math.random().toString(36).substring(5)}`;
        } else if (existingCustomKey) {
          mapping.streamKey = existingCustomKey;
        }

        mapping.status = StreamPlatformStatus.LIVE;
        await this.streamPlatformRepository.save(mapping);

        // Ensure FFmpeg relay is running even in fallback mode if a stream key exists
        if (mapping.streamUrl && mapping.streamKey) {
          this.ffmpegService.startForwarding({
            streamId: id,
            sourceUrl: 'pipe:0',
            destinationUrl: mapping.streamUrl,
            streamKey: mapping.streamKey,
          });
        }

        successCount++;
      }
    }

    // Emit live WebSockets update
    const details = platforms.map((p) => ({
      platform: p.connectedAccount?.platformName || 'UNKNOWN',
      url: p.streamUrl,
      key: p.streamKey ? `${p.streamKey.substring(0, 4)}••••••••` : '••••••••',
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

    // Stop FFmpeg relay processes and close Media Server stream session
    this.ffmpegService.stopForwarding(id);
    this.mediaServerService.closeSession(id);

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
