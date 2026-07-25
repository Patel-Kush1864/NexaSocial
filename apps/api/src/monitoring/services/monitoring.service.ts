import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LiveStream,
  StreamStatus,
} from '../../livestreams/entities/livestream.entity';
import {
  StreamPlatform,
  StreamPlatformStatus,
} from '../../stream-platforms/entities/stream-platform.entity';
import { OAuthToken } from '../../social/entities/oauth-token.entity';
import { YoutubeAdapter } from '../../livestreams/adapters/youtube.adapter';
import { FacebookAdapter } from '../../livestreams/adapters/facebook.adapter';
import { TwitchAdapter } from '../../livestreams/adapters/twitch.adapter';
import { LinkedinAdapter } from '../../livestreams/adapters/linkedin.adapter';
import { LiveStreamGateway } from '../../livestreams/gateways/livestream.gateway';
import { decrypt } from '../../social/utils/crypto.helper';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    @InjectRepository(LiveStream)
    private readonly streamRepository: Repository<LiveStream>,
    @InjectRepository(StreamPlatform)
    private readonly streamPlatformRepository: Repository<StreamPlatform>,
    @InjectRepository(OAuthToken)
    private readonly tokenRepository: Repository<OAuthToken>,
    private readonly streamGateway: LiveStreamGateway,

    private readonly youtubeAdapter: YoutubeAdapter,
    private readonly facebookAdapter: FacebookAdapter,
    private readonly twitchAdapter: TwitchAdapter,
    private readonly linkedinAdapter: LinkedinAdapter,
  ) {}

  private getPlatformAdapter(platformName: string) {
    const p = platformName.toUpperCase();
    if (p === 'YOUTUBE') return this.youtubeAdapter;
    if (p === 'FACEBOOK') return this.facebookAdapter;
    if (p === 'TWITCH') return this.twitchAdapter;
    if (p === 'LINKEDIN') return this.linkedinAdapter;
    return null;
  }

  async monitorActiveStreams(): Promise<void> {
    const activeStreams = await this.streamRepository.find({
      where: { status: StreamStatus.LIVE },
      relations: { platforms: { connectedAccount: true } },
    });

    for (const stream of activeStreams) {
      let allEnded = true;
      for (const platform of stream.platforms) {
        if (
          platform.status !== StreamPlatformStatus.LIVE ||
          !platform.platformStreamId
        ) {
          continue;
        }

        try {
          const token = await this.tokenRepository.findOne({
            where: { connectedAccountId: platform.connectedAccountId },
          });
          if (!token) continue;

          const decryptedToken = decrypt(token.accessToken);
          const adapter = this.getPlatformAdapter(
            platform.connectedAccount?.platformName || '',
          );
          if (!adapter) continue;

          const status = await adapter.getStatus(
            decryptedToken,
            platform.platformStreamId,
          );
          if (
            status === 'complete' ||
            status === 'ended' ||
            status === 'offline'
          ) {
            platform.status = StreamPlatformStatus.ENDED;
            await this.streamPlatformRepository.save(platform);
            this.logger.log(
              `Active monitor: stream ${stream.id} platform ${platform.connectedAccount?.platformName} ended.`,
            );
          } else {
            allEnded = false;
          }
        } catch (err: any) {
          const errMsg = err instanceof Error ? err.message : String(err);
          this.logger.warn(
            `Failed to monitor stream platform ${platform.id}: ${errMsg}`,
          );
          allEnded = false;
        }
      }

      // If all destinations have ended, mark parent stream as ended
      if (allEnded && stream.platforms.length > 0) {
        stream.status = StreamStatus.ENDED;
        stream.endedAt = new Date();
        await this.streamRepository.save(stream);
        this.streamGateway.emitStreamEnded(stream.workspaceId, stream.id);
        this.logger.log(
          `Active monitor: all platforms ended. LiveStream ${stream.id} is now ENDED.`,
        );
      }
    }
  }

  async getHealthStatus(): Promise<{
    activeStreams: number;
    monitoredPlatforms: number;
    timestamp: string;
  }> {
    const activeStreamsCount = await this.streamRepository.count({
      where: { status: StreamStatus.LIVE },
    });
    const activePlatformsCount = await this.streamPlatformRepository.count({
      where: { status: StreamPlatformStatus.LIVE },
    });
    return {
      activeStreams: activeStreamsCount,
      monitoredPlatforms: activePlatformsCount,
      timestamp: new Date().toISOString(),
    };
  }
}
