import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectedAccount } from './entities/connected-account.entity';
import { OAuthToken } from './entities/oauth-token.entity';
import { Platform } from '../database/entities/platform.entity';
import { ActivityLog } from '../users/entities/activity-log.entity';
import { WorkspaceMember } from '../workspace-members/entities/workspace-member.entity';
import { SocialService } from './services/social.service';
import { SocialController } from './controllers/social.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { LoggerModule } from '../logger/logger.module';

// Platform Services
import { YoutubeService } from './platforms/youtube/youtube.service';
import { FacebookService } from './platforms/facebook/facebook.service';
import { InstagramService } from './platforms/instagram/instagram.service';
import { LinkedinService } from './platforms/linkedin/linkedin.service';
import { TwitterService } from './platforms/twitter/twitter.service';
import { TwitchService } from './platforms/twitch/twitch.service';
import { TiktokService } from './platforms/tiktok/tiktok.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConnectedAccount,
      OAuthToken,
      Platform,
      ActivityLog,
      WorkspaceMember,
    ]),
    SubscriptionsModule,
    LoggerModule,
  ],
  controllers: [SocialController],
  providers: [
    SocialService,
    YoutubeService,
    FacebookService,
    InstagramService,
    LinkedinService,
    TwitterService,
    TwitchService,
    TiktokService,
  ],
  exports: [SocialService, TypeOrmModule],
})
export class SocialModule {}
