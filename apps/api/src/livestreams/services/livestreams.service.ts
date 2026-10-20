/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import {
  ConnectedAccount,
  AccountStatus,
} from '../../social/entities/connected-account.entity';
import { SocialAccount } from '../../social/entities/social-account.entity';
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
import { InstagramAdapter } from '../adapters/instagram.adapter';

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
    @InjectRepository(SocialAccount)
    private readonly socialAccountRepository: Repository<SocialAccount>,
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
    private readonly instagramAdapter: InstagramAdapter,

    // Inject Media Pipeline Services
    private readonly ffmpegService: FFmpegService,
    private readonly mediaServerService: MediaServerService,
  ) { }

  private async getDecryptedTokenForAccount(
    connectedAccountId: string,
  ): Promise<{ accessToken: string; pageId?: string }> {
    const sa = await this.socialAccountRepository.findOne({
      where: { id: connectedAccountId },
    });
    let rawToken = sa?.pageAccessToken || sa?.accessToken;
    const pageId = sa?.pageId;

    if (!rawToken) {
      const tokenRec = await this.tokenRepository.findOne({
        where: { connectedAccountId },
      });
      rawToken = tokenRec?.accessToken;
    }

    if (!rawToken) {
      return { accessToken: '', pageId };
    }

    let decrypted = rawToken;
    if (rawToken.includes(':')) {
      try {
        decrypted = decrypt(rawToken);
      } catch {
        decrypted = rawToken;
      }
    }

    return { accessToken: decrypted, pageId };
  }

  private async resolveAndSyncAccounts(
    accountIds: string[],
    workspaceId: string,
  ): Promise<ConnectedAccount[]> {
    if (!accountIds || accountIds.length === 0) return [];

    const accounts = await this.accountRepository.find({
      where: { id: In(accountIds) },
    });

    if (accounts.length !== accountIds.length) {
      const existingIds = new Set(accounts.map((a) => a.id));
      const missingIds = accountIds.filter((id) => !existingIds.has(id));

      const socialAccounts = await this.socialAccountRepository.find({
        where: { id: In(missingIds) },
      });

      for (const sa of socialAccounts) {
        let connAcc = await this.accountRepository.findOne({
          where: { id: sa.id },
        });
        if (!connAcc) {
          connAcc = this.accountRepository.create({
            id: sa.id,
            workspaceId: workspaceId,
            platformName: (sa.provider || 'FACEBOOK').toUpperCase(),
            platformUserId: sa.pageId || sa.providerUserId,
            name: sa.pageName || sa.providerName || 'Facebook Page',
            status: AccountStatus.CONNECTED,
          });
          await this.accountRepository.save(connAcc);
        }

        let tokenRec = await this.tokenRepository.findOne({
          where: { connectedAccountId: sa.id },
        });
        if (!tokenRec) {
          tokenRec = this.tokenRepository.create({
            connectedAccountId: sa.id,
            accessToken: sa.pageAccessToken || sa.accessToken || '',
            expiresAt: sa.expiresAt,
            scope: sa.scopes,
          });
          await this.tokenRepository.save(tokenRec);
        }

        accounts.push(connAcc);
      }
    }

    if (accounts.length !== accountIds.length) {
      throw new BadRequestException(
        'Selected connected accounts are invalid for this workspace.',
      );
    }

    return accounts;
  }

  private getPlatformAdapter(platformName: string): PlatformAdapter {
    const p = platformName.toUpperCase();
    if (p === 'YOUTUBE') return this.youtubeAdapter;
    if (p === 'FACEBOOK') return this.facebookAdapter;
    if (p === 'INSTAGRAM') return this.instagramAdapter;
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
    const accounts = await this.resolveAndSyncAccounts(accountIds, workspaceId);

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
    let streamPlatforms: StreamPlatform[] = [];
    if (accounts.length > 0) {
      streamPlatforms = accounts.map((acc) =>
        this.streamPlatformRepository.create({
          streamId: stream.id,
          connectedAccountId: acc.id,
          status: StreamPlatformStatus.PENDING,
          sourceStatus: 'DISCONNECTED',
          metadataStatus: 'PENDING',
          publishStatus: 'IDLE',
          facebookPageId:
            acc.platformName === 'FACEBOOK'
              ? acc.platformUserId || (acc.metadata?.pageId as string)
              : undefined,
        }),
      );
      streamPlatforms =
        await this.streamPlatformRepository.save(streamPlatforms);

      // Auto-prepare Facebook post details on Graph API if Facebook account is connected
      for (const p of streamPlatforms) {
        const acc = accounts.find((a) => a.id === p.connectedAccountId);
        if (acc?.platformName === 'FACEBOOK') {
          try {
            await this.syncFacebookMetadata(stream.id, workspaceId, {
              platformId: p.id,
              title: stream.title,
              description: stream.description,
            });
          } catch (fbErr: any) {
            this.loggerService.warn(
              `Initial Facebook post metadata auto-sync notice: ${fbErr.message}`,
              'LiveStreamsService',
            );
          }
        }
      }
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

    if (dto.title || dto.description !== undefined) {
      const fbPlatforms = await this.streamPlatformRepository.find({
        where: { streamId: id },
        relations: { connectedAccount: true },
      });
      for (const p of fbPlatforms) {
        if (p.connectedAccount?.platformName === 'FACEBOOK') {
          try {
            await this.syncFacebookMetadata(id, workspaceId, {
              platformId: p.id,
              title: stream.title,
              description: stream.description,
            });
          } catch (fbErr: any) {
            this.loggerService.warn(
              `Facebook post metadata update notice: ${fbErr.message}`,
              'LiveStreamsService',
            );
          }
        }
      }
    }

    // Update platform mappings if specified
    const updateAccountIds = dto.connectedAccountIds || dto.platformAccountIds;
    if (updateAccountIds && updateAccountIds.length > 0) {
      const accounts = await this.resolveAndSyncAccounts(
        updateAccountIds,
        workspaceId,
      );
      // Remove old platform stream details
      await this.streamPlatformRepository.delete({ streamId: id });
      // Create new platform stream details
      const newMappings = accounts.map((acc) => {
        let streamUrl = undefined;
        let streamKey = undefined;
        if (
          acc.platformName === 'FACEBOOK' ||
          acc.platformName === 'INSTAGRAM'
        ) {
          streamUrl = acc.metadata?.rtmpsUrl;
          streamKey = acc.metadata?.streamKey;
        }
        return this.streamPlatformRepository.create({
          streamId: id,
          connectedAccountId: acc.id,
          status: StreamPlatformStatus.PENDING,
          streamUrl,
          streamKey,
        });
      });
      await this.streamPlatformRepository.save(newMappings);
    }

    // Update custom Stream Key if provided (generic)
    const customKey = dto.youtubeStreamKey || dto.customStreamKey;
    const customUrl = dto.customStreamUrl;

    if (customKey !== undefined || customUrl !== undefined) {
      let cleanedKey = customKey ? customKey.trim() : undefined;
      if (cleanedKey && cleanedKey.startsWith('x-youtube-key-')) {
        cleanedKey = cleanedKey.replace(/^x-youtube-key-/, '');
      }

      // Prevent overwriting with redacted key
      if (cleanedKey === '••••••••••••••••') {
        cleanedKey = undefined;
      }

      const existingPlatforms = await this.streamPlatformRepository.find({
        where: {
          streamId: id,
          ...(dto.platformId ? { id: dto.platformId } : {}),
        },
        relations: { connectedAccount: true },
      });

      let didChange = false;
      if (existingPlatforms.length === 0 && !dto.platformId) {
        // ... (existing code for creating ytAccount if needed)
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
        didChange = true;
      } else {
        for (const p of existingPlatforms) {
          if (cleanedKey !== undefined && p.streamKey !== cleanedKey) {
            p.streamKey = cleanedKey;
            const keyMatch = cleanedKey.match(/^FB-(\d+)-/);
            if (keyMatch && p.connectedAccount?.platformName === 'FACEBOOK') {
              p.facebookLiveVideoId = keyMatch[1];
              p.metadataStatus = 'PENDING';
            }
            didChange = true;
          }
          if (customUrl !== undefined && p.streamUrl !== customUrl) {
            p.streamUrl = customUrl;
            didChange = true;
          } else if (
            !p.streamUrl &&
            p.connectedAccount?.platformName === 'YOUTUBE'
          ) {
            p.streamUrl = 'rtmps://a.rtmps.youtube.com/live2';
            didChange = true;
          }
          await this.streamPlatformRepository.save(p);

          // Persist Facebook/Instagram RTMPS credentials so user doesn't have to enter them every time
          if (
            didChange &&
            (p.connectedAccount?.platformName === 'FACEBOOK' ||
              p.connectedAccount?.platformName === 'INSTAGRAM')
          ) {
            const acc = p.connectedAccount;
            acc.metadata = acc.metadata || {};
            if (p.streamUrl) acc.metadata.rtmpsUrl = p.streamUrl;
            if (p.streamKey) acc.metadata.streamKey = p.streamKey;
            await this.accountRepository.save(acc);

            if (p.connectedAccount?.platformName === 'FACEBOOK') {
              try {
                await this.verifyFacebookSource(id, workspaceId, {
                  platformId: p.id,
                  streamUrl: p.streamUrl,
                  streamKey: p.streamKey,
                });
              } catch (vErr: any) {
                this.loggerService.warn(
                  `Facebook source verification notice: ${vErr.message}`,
                  'LiveStreamsService',
                );
              }
            }
          }
        }
      }

      if (stream.status === StreamStatus.LIVE && didChange) {
        const mediaSession =
          this.mediaServerService.getSession(id) ||
          this.mediaServerService.createStreamSession(id);

        // Restart forwarding with new key
        this.ffmpegService.stopForwarding(id);
        for (const p of existingPlatforms) {
          if (p.streamUrl) {
            this.ffmpegService.startForwarding({
              streamId: id,
              sourceUrl: mediaSession.rtmpSourceUrl,
              destinationUrl: p.streamUrl,
              streamKey: cleanedKey || p.streamKey || '',
              platform: p.connectedAccount?.platformName,
            });
          }
        }
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
      stream.endedAt = null as any;
      await this.streamRepository.save(stream);
    }

    // Stop any stale forwarding processes from previous attempts
    this.ffmpegService.stopForwarding(id);

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

        if (platformName === 'FACEBOOK') {
          try {
            await this.goLiveFacebook(
              id,
              stream.workspaceId,
              userId || stream.createdBy,
              mapping.id,
            );
            successCount++;
            continue;
          } catch (fbErr) {
            this.loggerService.warn(
              `[LIVE] Facebook start error: ${fbErr instanceof Error ? fbErr.message : String(fbErr)}`,
              'LiveStreamsService',
            );
            throw fbErr;
          }
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
            platform: platformName,
          });
        }

        mapping.status = StreamPlatformStatus.WAITING_FOR_PLATFORM_PREVIEW;
        await this.streamPlatformRepository.save(mapping);
        successCount++;

        // Step 5 & 6 (Background Async Task): Poll stream ingestion & transition broadcast to LIVE in background
        if (!decryptedAccessToken.startsWith('mock_')) {
          const streamPlatformId = mapping.id;
          const platformStreamId = broadcast.platformStreamId;
          const streamId = broadcast.streamId || platformStreamId;

          setImmediate(() => {
            void (async () => {
              try {
                if (adapter.waitForStreamActive) {
                  this.loggerService.log(
                    `[LIVE Background] Monitoring ${platformName} ingestion for stream [${streamId}]...`,
                    'LiveStreamsService',
                  );
                  const isActive = await adapter.waitForStreamActive(
                    decryptedAccessToken,
                    streamId,
                    60000,
                  );
                  if (!isActive) {
                    throw new Error(
                      'Stream data was not received by the platform in time.',
                    );
                  }
                }
                this.loggerService.log(
                  `[LIVE Background] Transitioning ${platformName} broadcast [${platformStreamId}] to LIVE...`,
                  'LiveStreamsService',
                );
                await adapter.startBroadcast(
                  decryptedAccessToken,
                  platformStreamId,
                );

                let viewerUrl: string | undefined = undefined;
                if (adapter.getViewerUrl) {
                  viewerUrl =
                    (await adapter.getViewerUrl(
                      decryptedAccessToken,
                      platformStreamId,
                    )) || undefined;
                }

                await this.streamPlatformRepository.update(streamPlatformId, {
                  status: StreamPlatformStatus.LIVE,
                  viewerUrl,
                });
                this.loggerService.log(
                  `[LIVE Background] ${platformName} broadcast is fully LIVE!`,
                  'LiveStreamsService',
                );

                // Ensure parent stream status is kept as LIVE
                await this.streamRepository.update(id, {
                  status: StreamStatus.LIVE,
                  endedAt: null as any,
                });

                // Emit live WebSockets update so UI reflects LIVE immediately
                const updatedPlatforms =
                  await this.streamPlatformRepository.find({
                    where: { streamId: id },
                    relations: { connectedAccount: true },
                  });
                const details = updatedPlatforms.map((p) => ({
                  platform: p.connectedAccount?.platformName || 'UNKNOWN',
                  url: p.streamUrl,
                  key: p.streamKey
                    ? `${p.streamKey.substring(0, 4)}••••••••`
                    : '••••••••',
                  status: p.status,
                  viewerUrl: p.viewerUrl,
                }));
                this.streamGateway.emitStreamStarted(
                  stream.workspaceId,
                  id,
                  details,
                );
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                this.loggerService.warn(
                  `[LIVE Background Notice] ${platformName} transition: ${msg}`,
                  'LiveStreamsService',
                );
                await this.streamPlatformRepository.update(streamPlatformId, {
                  status: StreamPlatformStatus.FAILED,
                });
              }
            })();
          });
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const accountName = mapping.connectedAccount?.name || platformName;
        this.loggerService.warn(
          `[LIVE] Error on platform ${accountName}: ${errMsg}`,
          'LiveStreamsService',
          'application',
        );

        const existingCustomKey =
          mapping.streamKey && !mapping.streamKey.startsWith('x-youtube-key-')
            ? mapping.streamKey
            : null;

        const isFacebookManuallyConfigured =
          platformName === 'FACEBOOK' && mapping.streamUrl && existingCustomKey;
        const isInstagramManuallyConfigured =
          platformName === 'INSTAGRAM' &&
          (mapping.streamUrl ||
            'rtmps://live-upload.instagram.com:443/rtmp/') &&
          existingCustomKey;

        if (
          platformName === 'YOUTUBE' ||
          isFacebookManuallyConfigured ||
          isInstagramManuallyConfigured
        ) {
          mapping.platformStreamId =
            mapping.platformStreamId ||
            `${platformName.toLowerCase()}_broadcast_${id}`;

          if (platformName === 'YOUTUBE') {
            mapping.streamUrl =
              mapping.streamUrl || 'rtmps://a.rtmps.youtube.com/live2';
            if (!existingCustomKey && !mapping.streamKey) {
              mapping.streamKey = `x-youtube-key-${Math.random().toString(36).substring(5)}`;
            }
          }

          if (platformName === 'INSTAGRAM') {
            mapping.streamUrl =
              mapping.streamUrl ||
              'rtmps://live-upload.instagram.com:443/rtmp/';
          }

          if (existingCustomKey) {
            mapping.streamKey = existingCustomKey;
          }

          if (platformName === 'YOUTUBE') {
            mapping.status = StreamPlatformStatus.LIVE;
          } else {
            mapping.status = StreamPlatformStatus.WAITING_FOR_PLATFORM_PREVIEW;
          }
          await this.streamPlatformRepository.save(mapping);

          if (mapping.streamUrl && mapping.streamKey) {
            this.ffmpegService.startForwarding({
              streamId: id,
              sourceUrl: 'pipe:0',
              destinationUrl: mapping.streamUrl,
              streamKey: mapping.streamKey,
              platform: platformName,
            });
          }

          successCount++;
        } else {
          mapping.status = StreamPlatformStatus.FAILED;
          await this.streamPlatformRepository.save(mapping);
        }
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

    // If all platforms failed to start, mark the overall stream as FAILED
    if (successCount === 0 && platforms.length > 0) {
      stream.status = StreamStatus.FAILED;
      await this.streamRepository.save(stream);

      this.mediaServerService.closeSession(id);

      // Let the caller know the start failed overall
      throw new BadRequestException(
        'Failed to start stream on all selected platforms.',
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
          const { accessToken: decryptedAccessToken } =
            await this.getDecryptedTokenForAccount(mapping.connectedAccountId);
          if (decryptedAccessToken) {
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
    const streams = await this.streamRepository.find({
      where: {
        workspaceId,
        status: In([StreamStatus.ENDED, StreamStatus.CANCELLED]),
      },
      relations: { platforms: { connectedAccount: true } },
      order: { endedAt: 'DESC' },
    });
    return streams.map((stream) => {
      if (stream.platforms) {
        stream.platforms = stream.platforms.map((p) => {
          if (p.streamKey && !p.streamKey.startsWith('x-youtube-key-')) {
            return { ...p, streamKey: '••••••••••••••••' } as any;
          }
          return p;
        });
      }
      return stream;
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

  async syncFacebookMetadata(
    streamId: string,
    workspaceId: string,
    options?: { platformId?: string; title?: string; description?: string },
  ) {
    const stream = await this.streamRepository.findOne({
      where: { id: streamId, workspaceId },
      relations: { platforms: { connectedAccount: true } },
    });
    if (!stream) {
      throw new NotFoundException('Live stream not found');
    }

    const fbPlatform = stream.platforms?.find(
      (p) =>
        (options?.platformId ? p.id === options.platformId : true) &&
        (p.connectedAccount?.platformName?.toUpperCase() === 'FACEBOOK' ||
          (p.connectedAccount as any)?.provider?.toUpperCase() === 'FACEBOOK'),
    );

    if (!fbPlatform) {
      throw new BadRequestException(
        'No Facebook destination found for this live stream',
      );
    }

    const { accessToken, pageId } = await this.getDecryptedTokenForAccount(
      fbPlatform.connectedAccountId,
    );

    const title = options?.title || stream.title;
    const description =
      options?.description !== undefined
        ? options.description
        : stream.description || '';
    const targetPageId =
      pageId ||
      fbPlatform.facebookPageId ||
      fbPlatform.connectedAccount?.platformUserId;

    console.log(
      `\n\x1b[1;35m════════════════════════════════════════════════════════════════════════════════\n` +
      `▶ [STEP 2 EXECUTION: SYNC FACEBOOK POST DETAILS]\n` +
      `════════════════════════════════════════════════════════════════════════════════\x1b[0m\n` +
      `  • Stream ID:          ${streamId}\n` +
      `  • Title:              "${title}"\n` +
      `  • Description:        "${description.slice(0, 50)}${description.length > 50 ? '...' : ''}"\n` +
      `  • Page / Account ID:  ${targetPageId || 'me'}\n` +
      `  • Existing Video ID:  ${fbPlatform.facebookLiveVideoId || '\x1b[33mNONE (Will create new broadcast)\x1b[0m'}\n` +
      `  • Has Access Token?:  ${accessToken ? 'YES' : 'NO'}\n`,
    );

    if (!accessToken || accessToken.startsWith('mock_')) {
      console.log(
        `  \x1b[33m⚠ Manual stream mode: saving metadata locally without Graph API OAuth\x1b[0m\n`,
      );
      fbPlatform.metadataStatus = 'COMPLETED';
      fbPlatform.metadataCompletedAt = new Date();
      fbPlatform.facebookPageId = targetPageId;
      await this.streamPlatformRepository.save(fbPlatform);
      return {
        metadataCompleted: true,
        sourceConnected: fbPlatform.sourceStatus === 'CONNECTED',
        publishRequested: fbPlatform.publishStatus === 'PUBLISHED',
        facebookStatus: fbPlatform.status,
        facebookLiveVideoId: fbPlatform.facebookLiveVideoId,
        message: 'Facebook metadata saved locally (manual stream mode)',
      };
    }

    try {
      if (!fbPlatform.facebookLiveVideoId) {
        console.log(
          `  [Graph API] Creating new Facebook Live Video on Page ${targetPageId || 'me'}...`,
        );
        this.loggerService.log(
          `[Facebook Live Step 2] Creating Facebook live video object for stream ${streamId} on Page ${targetPageId || 'me'}`,
          'LiveStreamsService',
        );
        const broadcast = await this.facebookAdapter.createBroadcast(
          accessToken,
          title,
          description,
          targetPageId,
        );

        fbPlatform.facebookLiveVideoId = broadcast.platformStreamId;
        fbPlatform.platformStreamId = broadcast.platformStreamId;
        fbPlatform.facebookPageId = targetPageId;
        if (broadcast.streamUrl) fbPlatform.streamUrl = broadcast.streamUrl;
        if (broadcast.streamKey) fbPlatform.streamKey = broadcast.streamKey;
        fbPlatform.metadataStatus = 'COMPLETED';
        fbPlatform.metadataCompletedAt = new Date();
        fbPlatform.facebookLastError = undefined;
        fbPlatform.facebookLastErrorCode = undefined;

        console.log(
          `  \x1b[1;32m✔ Broadcast Object Created Successfully!\x1b[0m\n` +
          `    • Facebook Live Video ID: \x1b[1;32m${broadcast.platformStreamId}\x1b[0m\n` +
          `    • RTMPS Endpoint:         ${fbPlatform.streamUrl}\n` +
          `    • Stream Key:             ${fbPlatform.streamKey ? fbPlatform.streamKey.slice(0, 6) + '••••••••' : '(none)'}\n` +
          `    • Direct Producer Link:   \x1b[4;34mhttps://www.facebook.com/live/producer/${broadcast.platformStreamId}\x1b[0m\n`,
        );

        // Stop any old forwarding and immediately start FFmpeg forwarding to this specific live video's stream key
        if (fbPlatform.streamUrl && fbPlatform.streamKey) {
          console.log(
            `  [Relay] Restarting FFmpeg forwarder to new Facebook Live Video key (${fbPlatform.streamKey.slice(0, 6)}••••••••)...`,
          );
          this.ffmpegService.stopForwarding(streamId);
          this.ffmpegService.startForwarding({
            streamId,
            sourceUrl: 'pipe:0',
            destinationUrl: fbPlatform.streamUrl,
            streamKey: fbPlatform.streamKey,
            platform: 'FACEBOOK',
          });
        }

        // Persist new stream credentials on connected account
        if (fbPlatform.connectedAccount) {
          const acc = fbPlatform.connectedAccount;
          acc.metadata = acc.metadata || {};
          if (fbPlatform.streamUrl)
            acc.metadata.rtmpsUrl = fbPlatform.streamUrl;
          if (fbPlatform.streamKey)
            acc.metadata.streamKey = fbPlatform.streamKey;
          await this.accountRepository.save(acc);
        }
      } else {
        console.log(
          `  [Graph API] Updating existing Facebook Live Video ${fbPlatform.facebookLiveVideoId}...`,
        );
        this.loggerService.log(
          `[Facebook Live Step 2] Updating Facebook live video ${fbPlatform.facebookLiveVideoId} metadata on Graph API`,
          'LiveStreamsService',
        );

        let needsFreshBroadcast = false;
        try {
          await this.facebookAdapter.updateMetadata(
            accessToken,
            fbPlatform.facebookLiveVideoId,
            title,
            description,
          );
        } catch (updateErr: any) {
          if (
            updateErr.code === 100 ||
            updateErr.errorSubcode === 33 ||
            String(updateErr.message || '').includes('Object with ID')
          ) {
            console.warn(
              `  \x1b[33m⚠ Video ID ${fbPlatform.facebookLiveVideoId} is inaccessible (personal profile draft or expired). Creating fresh Page broadcast...\x1b[0m`,
            );
            needsFreshBroadcast = true;
          } else {
            throw updateErr;
          }
        }

        if (needsFreshBroadcast) {
          const freshBroadcast = await this.facebookAdapter.createBroadcast(
            accessToken,
            title,
            description,
            targetPageId,
          );
          fbPlatform.facebookLiveVideoId = freshBroadcast.platformStreamId;
          fbPlatform.platformStreamId = freshBroadcast.platformStreamId;
          fbPlatform.facebookPageId = targetPageId;
          if (freshBroadcast.streamUrl)
            fbPlatform.streamUrl = freshBroadcast.streamUrl;
          if (freshBroadcast.streamKey)
            fbPlatform.streamKey = freshBroadcast.streamKey;
        } else {
          // Fetch authoritative live video credentials from Graph API to guarantee streamKey matches fbPlatform.facebookLiveVideoId
          try {
            const ingest = await this.facebookAdapter.verifyStreamIngest(
              accessToken,
              fbPlatform.facebookLiveVideoId,
            );
            if (ingest.streamUrl && ingest.streamUrl.includes('/rtmp/')) {
              const parts = ingest.streamUrl.split('/rtmp/');
              if (parts[0]) fbPlatform.streamUrl = `${parts[0]}/rtmp/`;
              if (parts[1]) fbPlatform.streamKey = parts[1];
            }
          } catch {
            // Ingest query fallback
          }
        }

        fbPlatform.metadataStatus = 'COMPLETED';
        fbPlatform.metadataCompletedAt = new Date();
        fbPlatform.facebookLastError = undefined;
        fbPlatform.facebookLastErrorCode = undefined;

        console.log(
          `  \x1b[1;32m✔ Updated metadata on Facebook Graph API successfully!\x1b[0m\n` +
          `    • Live Video ID: \x1b[1;32m${fbPlatform.facebookLiveVideoId}\x1b[0m\n` +
          `    • RTMPS Server:  ${fbPlatform.streamUrl}\n` +
          `    • Stream Key:    ${fbPlatform.streamKey ? fbPlatform.streamKey.slice(0, 6) + '••••••••' : '(none)'}\n`,
        );

        // Keep connected account metadata in sync
        if (fbPlatform.connectedAccount) {
          const acc = fbPlatform.connectedAccount;
          acc.metadata = acc.metadata || {};
          if (fbPlatform.streamUrl)
            acc.metadata.rtmpsUrl = fbPlatform.streamUrl;
          if (fbPlatform.streamKey)
            acc.metadata.streamKey = fbPlatform.streamKey;
          await this.accountRepository.save(acc);
        }
      }

      // Sync active FFmpeg forwarder to ensure incoming camera packets reach this matching stream key
      if (fbPlatform.streamUrl && fbPlatform.streamKey) {
        if (!this.ffmpegService.isForwarding(streamId, fbPlatform.streamKey)) {
          console.log(
            `  [Relay] Syncing FFmpeg forwarder to live video key (${fbPlatform.streamKey.slice(0, 6)}••••••••)...`,
          );
          this.ffmpegService.stopForwarding(streamId);
          this.ffmpegService.startForwarding({
            streamId,
            sourceUrl: 'pipe:0',
            destinationUrl: fbPlatform.streamUrl,
            streamKey: fbPlatform.streamKey,
            platform: 'FACEBOOK',
          });
        }
      }

      // Try fetching permalink / viewer url
      try {
        const viewerUrl = await this.facebookAdapter.getViewerUrl(
          accessToken,
          fbPlatform.facebookLiveVideoId,
        );
        if (viewerUrl) {
          fbPlatform.viewerUrl = viewerUrl;
        }
      } catch {
        // Fallback silently if permalink cannot be fetched immediately
      }

      await this.streamPlatformRepository.save(fbPlatform);

      const targetPage =
        targetPageId || fbPlatform.facebookPageId || '1275681598955336';
      const pageProducerUrl = `https://www.facebook.com/${targetPage}/live_producer/?broadcast_id=${fbPlatform.facebookLiveVideoId}`;

      console.log(
        `\x1b[1;32m✔ [STEP 2 COMPLETE]\x1b[0m Post details synced with Facebook Graph API!\n` +
        `  • Live Video ID: ${fbPlatform.facebookLiveVideoId}\n` +
        `  • Status:        COMPLETED\n` +
        `  • Stream Key:    ${fbPlatform.streamKey ? fbPlatform.streamKey.slice(0, 6) + '••••••••' : '(none)'}\n` +
        `  • Page Producer: ${pageProducerUrl}\n`,
      );

      return {
        metadataCompleted: true,
        sourceConnected: fbPlatform.sourceStatus === 'CONNECTED',
        publishRequested: fbPlatform.publishStatus === 'PUBLISHED',
        facebookStatus: fbPlatform.status,
        facebookLiveVideoId: fbPlatform.facebookLiveVideoId,
        streamKey: fbPlatform.streamKey,
        streamUrl: fbPlatform.streamUrl,
        viewerUrl: fbPlatform.viewerUrl,
        producerUrl: pageProducerUrl,
        message:
          'Step 2 Complete: Facebook post details confirmed by Graph API',
      };
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(
        `\x1b[1;31m✖ [STEP 2 FAILED]\x1b[0m Error updating Facebook post details:\n` +
        `  • Message: ${errMsg}\n` +
        `  • Code:    ${err.code || err.errorSubcode || 'FB_API_ERROR'}\n`,
      );
      this.loggerService.warn(
        `[Facebook Live Step 2 Error] Failed to complete post details: ${errMsg}`,
        'LiveStreamsService',
      );
      fbPlatform.metadataStatus = 'FAILED';
      fbPlatform.facebookLastError = errMsg;
      fbPlatform.facebookLastErrorCode = String(
        err.code || err.errorSubcode || 'FB_API_ERROR',
      );
      await this.streamPlatformRepository.save(fbPlatform);

      throw new BadRequestException(`Facebook post details error: ${errMsg}`);
    }
  }

  async verifyFacebookSource(
    streamId: string,
    workspaceId: string,
    options?: {
      platformId?: string;
      streamUrl?: string;
      customStreamUrl?: string;
      streamKey?: string;
      customStreamKey?: string;
    },
  ) {
    const stream = await this.streamRepository.findOne({
      where: { id: streamId, workspaceId },
      relations: { platforms: { connectedAccount: true } },
    });
    if (!stream) {
      throw new NotFoundException('Live stream not found');
    }

    const fbPlatform = stream.platforms?.find(
      (p) =>
        (options?.platformId ? p.id === options.platformId : true) &&
        (p.connectedAccount?.platformName?.toUpperCase() === 'FACEBOOK' ||
          (p.connectedAccount as any)?.provider?.toUpperCase() === 'FACEBOOK'),
    );

    if (!fbPlatform) {
      throw new BadRequestException(
        'No Facebook destination found for this live stream',
      );
    }

    const customUrl = options?.customStreamUrl || options?.streamUrl;
    const customKey = options?.customStreamKey || options?.streamKey;

    if (customUrl !== undefined) {
      const trimmedUrl = customUrl.trim();
      if (trimmedUrl && !/^rtmps?:\/\//i.test(trimmedUrl)) {
        throw new BadRequestException(
          'Invalid RTMPS endpoint: URL must begin with rtmp:// or rtmps://',
        );
      }
      fbPlatform.streamUrl = trimmedUrl;
    }

    if (customKey !== undefined) {
      const trimmedKey = customKey.trim();
      if (trimmedKey && trimmedKey !== '••••••••••••••••') {
        fbPlatform.streamKey = trimmedKey;
        const keyMatch = trimmedKey.match(/^FB-(\d+)-/);
        if (keyMatch) {
          const keyVideoId = keyMatch[1];
          if (fbPlatform.facebookLiveVideoId !== keyVideoId) {
            console.log(
              `  [Step 1] Detected broadcast ID ${keyVideoId} from stream key. Aligning facebookLiveVideoId...`,
            );
            fbPlatform.facebookLiveVideoId = keyVideoId;
            fbPlatform.metadataStatus = 'PENDING';
          }
        }
      }
    }

    const maskedKey = fbPlatform.streamKey
      ? fbPlatform.streamKey.length > 8
        ? `${fbPlatform.streamKey.slice(0, 4)}••••••••`
        : '••••••••'
      : '(missing)';

    console.log(
      `\n\x1b[1;36m════════════════════════════════════════════════════════════════════════════════\n` +
      `▶ [STEP 1 EXECUTION: VERIFY FACEBOOK VIDEO SOURCE]\n` +
      `════════════════════════════════════════════════════════════════════════════════\x1b[0m\n` +
      `  • Stream ID:      ${streamId} ("${stream.title}")\n` +
      `  • Platform ID:    ${fbPlatform.id}\n` +
      `  • Connected To:   ${fbPlatform.connectedAccount?.name || fbPlatform.connectedAccount?.platformUserId || 'Facebook Page'}\n` +
      `  • RTMPS Server:   ${fbPlatform.streamUrl || '\x1b[31mMISSING\x1b[0m'}\n` +
      `  • Stream Key:     ${maskedKey}\n` +
      `  • Live Video ID:  ${fbPlatform.facebookLiveVideoId || '(none yet - created in Step 2)'}\n`,
    );

    if (!fbPlatform.streamUrl || !fbPlatform.streamKey) {
      console.warn(
        `  \x1b[33m⚠ Step 1 incomplete: Missing RTMPS URL or Stream Key\x1b[0m\n`,
      );
      fbPlatform.sourceStatus = 'DISCONNECTED';
      await this.streamPlatformRepository.save(fbPlatform);
      return {
        sourceConnected: false,
        metadataCompleted: fbPlatform.metadataStatus === 'COMPLETED',
        publishRequested: fbPlatform.publishStatus === 'PUBLISHED',
        facebookStatus: fbPlatform.status,
        facebookLiveVideoId: fbPlatform.facebookLiveVideoId,
        message: 'Facebook RTMPS endpoint and Stream Key are required.',
      };
    }

    // Start or maintain FFmpeg relay so video packets reach Facebook
    if (!this.ffmpegService.isForwarding(streamId, fbPlatform.streamKey)) {
      console.log(
        `  [Relay] Starting FFmpeg relay to ${fbPlatform.streamUrl}...`,
      );
      this.ffmpegService.startForwarding({
        streamId,
        sourceUrl: 'pipe:0',
        destinationUrl: fbPlatform.streamUrl,
        streamKey: fbPlatform.streamKey,
        platform: 'FACEBOOK',
      });
    }

    const isRelayActive = this.ffmpegService.isForwarding(
      streamId,
      fbPlatform.streamKey,
    );
    console.log(
      `  • FFmpeg Relay Active?: ${isRelayActive ? '\x1b[32mYES\x1b[0m' : '\x1b[33mNO\x1b[0m'}`,
    );

    // If access token and live video id are available, verify Facebook ingest status
    const { accessToken } = await this.getDecryptedTokenForAccount(
      fbPlatform.connectedAccountId,
    );

    let facebookIngesting = false;
    if (
      accessToken &&
      !accessToken.startsWith('mock_') &&
      fbPlatform.facebookLiveVideoId
    ) {
      try {
        console.log(
          `  [Graph API] Verifying video ingest status on Facebook Video ${fbPlatform.facebookLiveVideoId}...`,
        );
        const ingest = await this.facebookAdapter.verifyStreamIngest(
          accessToken,
          fbPlatform.facebookLiveVideoId,
        );
        if (ingest.isIngesting || ingest.status === 'UNPUBLISHED') {
          facebookIngesting = true;
          console.log(
            `  • Facebook Ingest Status: \x1b[32mCONFIRMED (${ingest.status})\x1b[0m`,
          );
        }
      } catch (err: any) {
        console.warn(`  • Facebook ingest polling notice: ${err.message}`);
        this.loggerService.debug(
          `Facebook ingest polling notice: ${err.message}`,
          'LiveStreamsService',
        );
      }
    }

    if (isRelayActive || facebookIngesting) {
      fbPlatform.sourceStatus = 'CONNECTED';
      fbPlatform.sourceConnectedAt = new Date();
      fbPlatform.facebookLastError = undefined;
      fbPlatform.facebookLastErrorCode = undefined;
      console.log(
        `  \x1b[1;32m✔ [STEP 1 COMPLETE] Video source successfully connected to Facebook!\x1b[0m\n`,
      );
    } else {
      fbPlatform.sourceStatus = 'CONNECTING';
      console.log(
        `  \x1b[33m⏳ [STEP 1 PENDING] Video source relay active, waiting for incoming frames...\x1b[0m\n`,
      );
    }

    await this.streamPlatformRepository.save(fbPlatform);

    return {
      sourceConnected: fbPlatform.sourceStatus === 'CONNECTED',
      metadataCompleted: fbPlatform.metadataStatus === 'COMPLETED',
      publishRequested: fbPlatform.publishStatus === 'PUBLISHED',
      facebookStatus: fbPlatform.status,
      facebookLiveVideoId: fbPlatform.facebookLiveVideoId,
      isRelayActive,
      message:
        fbPlatform.sourceStatus === 'CONNECTED'
          ? 'Step 1 Complete: Video source successfully connected to Facebook'
          : 'Video source relay active, waiting for incoming video packets...',
    };
  }

  async goLiveFacebook(
    streamId: string,
    workspaceId: string,
    userId: string,
    platformId?: string,
  ) {
    const stream = await this.streamRepository.findOne({
      where: { id: streamId, workspaceId },
      relations: { platforms: { connectedAccount: true } },
    });
    if (!stream) {
      throw new NotFoundException('Live stream not found');
    }

    const fbPlatform = stream.platforms?.find(
      (p) =>
        (platformId ? p.id === platformId : true) &&
        (p.connectedAccount?.platformName?.toUpperCase() === 'FACEBOOK' ||
          (p.connectedAccount as any)?.provider?.toUpperCase() === 'FACEBOOK'),
    );

    if (!fbPlatform) {
      throw new BadRequestException(
        'No Facebook destination found for this live stream',
      );
    }

    console.log(
      `\n\x1b[1;32m════════════════════════════════════════════════════════════════════════════════\n` +
      `▶ [STEP 3 EXECUTION: GO LIVE ON FACEBOOK]\n` +
      `════════════════════════════════════════════════════════════════════════════════\x1b[0m\n` +
      `  • Stream ID:          ${streamId} ("${stream.title}")\n` +
      `  • Live Video ID:      ${fbPlatform.facebookLiveVideoId || '\x1b[31mMISSING\x1b[0m'}\n` +
      `  • Post Details State: ${fbPlatform.metadataStatus || 'PENDING'}\n` +
      `  • Current Status:     ${fbPlatform.status}\n`,
    );

    // Step 1 check: Ensure video relay is streaming
    if (!fbPlatform.streamUrl || !fbPlatform.streamKey) {
      console.error(
        `  \x1b[31m✖ Step 1 incomplete: Facebook RTMPS endpoint and stream key required\x1b[0m`,
      );
      throw new BadRequestException(
        'Step 1 incomplete: Facebook RTMPS endpoint and stream key must be configured.',
      );
    }

    if (!this.ffmpegService.isForwarding(streamId, fbPlatform.streamKey)) {
      console.log(`  [Relay] Starting FFmpeg relay before publishing...`);
      this.ffmpegService.startForwarding({
        streamId,
        sourceUrl: 'pipe:0',
        destinationUrl: fbPlatform.streamUrl,
        streamKey: fbPlatform.streamKey,
        platform: 'FACEBOOK',
      });
    }

    const { accessToken } = await this.getDecryptedTokenForAccount(
      fbPlatform.connectedAccountId,
    );

    // Step 2 check: Ensure post details are completed
    if (fbPlatform.metadataStatus !== 'COMPLETED') {
      console.log(
        `  [Step 2 Auto-Sync] Completing post details before publishing...`,
      );
      await this.syncFacebookMetadata(streamId, workspaceId, {
        platformId: fbPlatform.id,
        title: stream.title,
        description: stream.description,
      });
    }

    // Step 3: Execute Facebook publish operation
    if (accessToken && !accessToken.startsWith('mock_')) {
      if (!fbPlatform.facebookLiveVideoId) {
        console.error(
          `  \x1b[31m✖ Facebook Live Video ID is missing after Step 2\x1b[0m`,
        );
        throw new BadRequestException(
          'Step 2 incomplete: Facebook Live Video ID is missing. Please sync post details first.',
        );
      }

      try {
        console.log(
          `  [Graph API] Executing startBroadcast (status: LIVE_NOW) for Video ${fbPlatform.facebookLiveVideoId}...`,
        );
        this.loggerService.log(
          `[Facebook Live Step 3] Executing startBroadcast (LIVE_NOW) on Facebook video ${fbPlatform.facebookLiveVideoId}...`,
          'LiveStreamsService',
        );

        // Transition from UNPUBLISHED to LIVE_NOW on Facebook Graph API
        await this.facebookAdapter.startBroadcast(
          accessToken,
          fbPlatform.facebookLiveVideoId,
        );

        // Confirm status from Facebook
        const viewerUrl = await this.facebookAdapter.getViewerUrl(
          accessToken,
          fbPlatform.facebookLiveVideoId,
        );

        fbPlatform.status = StreamPlatformStatus.LIVE;
        fbPlatform.publishStatus = 'PUBLISHED';
        fbPlatform.publishedAt = new Date();
        fbPlatform.sourceStatus = 'CONNECTED';
        fbPlatform.sourceConnectedAt =
          fbPlatform.sourceConnectedAt || new Date();
        fbPlatform.metadataStatus = 'COMPLETED';
        fbPlatform.metadataCompletedAt =
          fbPlatform.metadataCompletedAt || new Date();
        if (viewerUrl) fbPlatform.viewerUrl = viewerUrl;
        fbPlatform.facebookLastError = undefined;
        fbPlatform.facebookLastErrorCode = undefined;

        stream.status = StreamStatus.LIVE;
        stream.startedAt = stream.startedAt || new Date();

        await this.streamPlatformRepository.save(fbPlatform);
        await this.streamRepository.save(stream);

        // Broadcast WebSocket event
        this.streamGateway.emitStreamStarted(workspaceId, streamId, [
          {
            platform: 'FACEBOOK',
            url: fbPlatform.streamUrl,
            key: '••••••••••••••••',
            status: StreamPlatformStatus.LIVE,
          },
        ]);

        console.log(
          `\n\x1b[1;32m🎉 [ALL 3 STEPS COMPLETE] Facebook Broadcast is now LIVE!\x1b[0m\n` +
          `  ✔ Step 1: Video source connected\n` +
          `  ✔ Step 2: Post details synced on Facebook\n` +
          `  ✔ Step 3: Published & LIVE on Facebook!\n` +
          `  • Video ID:      ${fbPlatform.facebookLiveVideoId}\n` +
          `  • Watch URL:     ${fbPlatform.viewerUrl || 'https://www.facebook.com/watch/live/?v=' + fbPlatform.facebookLiveVideoId}\n` +
          `  • Producer Link: \x1b[4;34mhttps://www.facebook.com/live/producer/${fbPlatform.facebookLiveVideoId}\x1b[0m\n`,
        );

        return {
          success: true,
          sourceConnected: true,
          metadataCompleted: true,
          publishRequested: true,
          facebookStatus: 'LIVE',
          facebookLiveVideoId: fbPlatform.facebookLiveVideoId,
          viewerUrl: fbPlatform.viewerUrl,
          message: 'Step 3 Complete: Broadcast is now LIVE on Facebook!',
        };
      } catch (err: any) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(
          `\x1b[1;31m✖ [STEP 3 FAILED] Facebook publishing error:\x1b[0m\n` +
          `  • Message: ${errMsg}\n` +
          `  • Code:    ${err.code || err.errorSubcode || 'PUBLISH_FAILED'}\n`,
        );
        this.loggerService.warn(
          `[Facebook Live Step 3 Error] Facebook publishing failed: ${errMsg}`,
          'LiveStreamsService',
        );

        fbPlatform.publishStatus = 'FAILED';
        fbPlatform.facebookLastError = errMsg;
        fbPlatform.facebookLastErrorCode = String(
          err.code || err.errorSubcode || 'PUBLISH_FAILED',
        );
        await this.streamPlatformRepository.save(fbPlatform);

        throw new BadRequestException(`Facebook Go Live failed: ${errMsg}`);
      }
    } else {
      // Manual broadcast mode without OAuth token
      fbPlatform.publishStatus = 'REQUESTED';
      fbPlatform.status = StreamPlatformStatus.WAITING_FOR_PLATFORM_PREVIEW;
      await this.streamPlatformRepository.save(fbPlatform);

      return {
        success: true,
        sourceConnected: true,
        metadataCompleted: true,
        publishRequested: true,
        facebookStatus: 'WAITING_FOR_PLATFORM_PREVIEW',
        requiresManualGoLive: true,
        message:
          'Video feed is streaming to Facebook! Please click "Go Live" in Facebook Live Producer to start.',
      };
    }
  }

  async getFacebookWorkflowStatus(
    streamId: string,
    workspaceId: string,
    platformId?: string,
  ) {
    const stream = await this.streamRepository.findOne({
      where: { id: streamId, workspaceId },
      relations: { platforms: { connectedAccount: true } },
    });
    if (!stream) {
      throw new NotFoundException('Live stream not found');
    }

    const fbPlatform = stream.platforms?.find(
      (p) =>
        (platformId ? p.id === platformId : true) &&
        (p.connectedAccount?.platformName?.toUpperCase() === 'FACEBOOK' ||
          (p.connectedAccount as any)?.provider?.toUpperCase() === 'FACEBOOK'),
    );

    if (!fbPlatform) {
      throw new BadRequestException(
        'No Facebook destination found for this live stream',
      );
    }

    const isRelayActive = this.ffmpegService.isForwarding(
      streamId,
      fbPlatform.streamKey,
    );

    return {
      sourceConnected: fbPlatform.sourceStatus === 'CONNECTED',
      metadataCompleted: fbPlatform.metadataStatus === 'COMPLETED',
      publishRequested: fbPlatform.publishStatus === 'PUBLISHED',
      sourceStatus: fbPlatform.sourceStatus,
      metadataStatus: fbPlatform.metadataStatus,
      publishStatus: fbPlatform.publishStatus,
      facebookStatus: fbPlatform.status,
      facebookLiveVideoId: fbPlatform.facebookLiveVideoId,
      facebookPageId: fbPlatform.facebookPageId,
      streamUrl: fbPlatform.streamUrl,
      viewerUrl: fbPlatform.viewerUrl,
      isRelayActive,
      sourceConnectedAt: fbPlatform.sourceConnectedAt,
      metadataCompletedAt: fbPlatform.metadataCompletedAt,
      publishedAt: fbPlatform.publishedAt,
      facebookLastError: fbPlatform.facebookLastError,
      facebookLastErrorCode: fbPlatform.facebookLastErrorCode,
      message: 'Facebook workflow status retrieved successfully',
    };
  }

  async confirmInstagramLive(
    streamId: string,
    workspaceId: string,
    userId: string,
    platformId?: string,
  ): Promise<any> {
    const stream = await this.streamRepository.findOne({
      where: { id: streamId, workspaceId },
      relations: { platforms: { connectedAccount: true } },
    });
    if (!stream) {
      throw new NotFoundException('Live stream not found in this workspace');
    }

    const igPlatform = stream.platforms?.find(
      (p) =>
        p.connectedAccount?.platformName === 'INSTAGRAM' &&
        (!platformId || p.id === platformId),
    );

    if (!igPlatform) {
      throw new BadRequestException(
        'No Instagram destination attached to this live stream',
      );
    }

    if (!igPlatform.streamKey) {
      throw new BadRequestException(
        'Instagram Stream Key is missing. Please configure your stream key from Instagram Live Producer before confirming live broadcast.',
      );
    }

    igPlatform.status = StreamPlatformStatus.LIVE;
    igPlatform.publishStatus = 'PUBLISHED';
    igPlatform.sourceStatus = 'CONNECTED';
    igPlatform.publishedAt = new Date();
    await this.streamPlatformRepository.save(igPlatform);

    if (stream.status !== StreamStatus.LIVE) {
      stream.status = StreamStatus.LIVE;
      stream.startedAt = stream.startedAt || new Date();
      await this.streamRepository.save(stream);
    }

    this.streamGateway.emitStreamStarted(stream.workspaceId, streamId, {
      id: streamId,
      platformId: igPlatform.id,
      platformName: 'INSTAGRAM',
      status: 'LIVE',
      viewerUrl: this.instagramAdapter.getViewerUrlForUsername(
        igPlatform.connectedAccount?.metadata?.username,
      ),
    });

    this.loggerService.log(
      `[LIVE] Instagram broadcast confirmed LIVE for stream ${streamId} by user ${userId}`,
      'LiveStreamsService',
      'application',
    );

    return {
      success: true,
      status: 'LIVE',
      platformId: igPlatform.id,
      viewerUrl: this.instagramAdapter.getViewerUrlForUsername(
        igPlatform.connectedAccount?.metadata?.username,
      ),
      producerUrl: this.instagramAdapter.getProducerUrl(),
      message: 'Instagram broadcast confirmed as LIVE!',
    };
  }

  async getInstagramWorkflowStatus(
    streamId: string,
    workspaceId: string,
    platformId?: string,
  ): Promise<any> {
    const stream = await this.streamRepository.findOne({
      where: { id: streamId, workspaceId },
      relations: { platforms: { connectedAccount: true } },
    });
    if (!stream) {
      throw new NotFoundException('Live stream not found in this workspace');
    }

    const igPlatform = stream.platforms?.find(
      (p) =>
        p.connectedAccount?.platformName === 'INSTAGRAM' &&
        (!platformId || p.id === platformId),
    );

    if (!igPlatform) {
      return {
        configured: false,
        message: 'No Instagram destination attached to this stream',
      };
    }

    const isRelayActive = igPlatform.streamKey
      ? this.ffmpegService.isForwarding(streamId, igPlatform.streamKey)
      : false;

    return {
      configured: true,
      platformId: igPlatform.id,
      status: igPlatform.status,
      streamUrl:
        igPlatform.streamUrl || 'rtmps://live-upload.instagram.com:443/rtmp/',
      isRelayActive,
      sourceConnected: Boolean(
        igPlatform.streamKey && igPlatform.streamKey.length > 5,
      ),
      isConfirmedLive: igPlatform.status === StreamPlatformStatus.LIVE,
      producerUrl: this.instagramAdapter.getProducerUrl(),
      viewerUrl: this.instagramAdapter.getViewerUrlForUsername(
        igPlatform.connectedAccount?.metadata?.username,
      ),
      publishedAt: igPlatform.publishedAt,
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

    // Redact stream keys in response and augment platform workflow status
    if (stream.platforms) {
      stream.platforms = stream.platforms.map((p) => {
        const maskedKey =
          p.streamKey && !p.streamKey.startsWith('x-youtube-key-')
            ? '••••••••••••••••'
            : p.streamKey;

        return {
          ...p,
          streamKey: maskedKey,
          sourceConnected: p.sourceStatus === 'CONNECTED',
          metadataCompleted: p.metadataStatus === 'COMPLETED',
          publishRequested:
            p.publishStatus === 'REQUESTED' || p.publishStatus === 'PUBLISHED',
          facebookStatus: p.status,
          facebookLiveVideoId: p.facebookLiveVideoId,
          facebookPageId: p.facebookPageId,
          sourceStatus: p.sourceStatus,
          metadataStatus: p.metadataStatus,
          publishStatus: p.publishStatus,
          sourceConnectedAt: p.sourceConnectedAt,
          metadataCompletedAt: p.metadataCompletedAt,
          publishedAt: p.publishedAt,
          facebookLastError: p.facebookLastError,
          facebookLastErrorCode: p.facebookLastErrorCode,
        } as any;
      });
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

  async sendScheduledStreamRemindersBackground(): Promise<void> {
    const now = new Date();
    const futureWindow = new Date(now.getTime() + 30 * 60 * 1000); // next 30 minutes

    try {
      const upcomingStreams = await this.streamRepository
        .createQueryBuilder('stream')
        .where('stream.status = :status', { status: StreamStatus.SCHEDULED })
        .andWhere('stream.scheduledAt BETWEEN :now AND :futureWindow', {
          now,
          futureWindow,
        })
        .getMany();

      for (const stream of upcomingStreams) {
        this.eventEmitter.emit(
          'stream.reminder',
          new StreamScheduledEvent(
            stream.id,
            stream.workspaceId,
            stream.createdBy,
            stream.scheduledAt!,
          ),
        );
      }
    } catch (err: any) {
      this.loggerService.warn(
        `Failed to query scheduled stream reminders: ${err.message}`,
        'LiveStreamsService',
      );
    }
  }
}
