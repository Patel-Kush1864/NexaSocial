import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveStream } from './entities/livestream.entity';
import { StreamPlatform } from '../stream-platforms/entities/stream-platform.entity';
import { ConnectedAccount } from '../social/entities/connected-account.entity';
import { OAuthToken } from '../social/entities/oauth-token.entity';
import { ActivityLog } from '../users/entities/activity-log.entity';
import { WorkspaceMember } from '../workspace-members/entities/workspace-member.entity';
import { LiveStreamsService } from './services/livestreams.service';
import { LiveStreamsController } from './controllers/livestreams.controller';
import { LiveStreamGateway } from './gateways/livestream.gateway';
import { LiveStreamsRepository } from './repositories/livestreams.repository';
import { LiveStreamEventsListener } from './listeners/livestream-events.listener';
import { LiveStreamSchedulerService } from './scheduler/livestream-scheduler.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { LoggerModule } from '../logger/logger.module';

// Adapters
import { YoutubeAdapter } from './adapters/youtube.adapter';
import { FacebookAdapter } from './adapters/facebook.adapter';
import { TwitchAdapter } from './adapters/twitch.adapter';
import { LinkedinAdapter } from './adapters/linkedin.adapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LiveStream,
      StreamPlatform,
      ConnectedAccount,
      OAuthToken,
      ActivityLog,
      WorkspaceMember,
    ]),
    SubscriptionsModule,
    LoggerModule,
  ],
  controllers: [LiveStreamsController],
  providers: [
    LiveStreamsService,
    LiveStreamsRepository,
    LiveStreamGateway,
    LiveStreamEventsListener,
    LiveStreamSchedulerService,
    YoutubeAdapter,
    FacebookAdapter,
    TwitchAdapter,
    LinkedinAdapter,
  ],
  exports: [
    LiveStreamsService,
    LiveStreamsRepository,
    LiveStreamGateway,
    LiveStreamSchedulerService,
    YoutubeAdapter,
    FacebookAdapter,
    TwitchAdapter,
    LinkedinAdapter,
    TypeOrmModule,
  ],
})
export class LiveStreamsModule {}
