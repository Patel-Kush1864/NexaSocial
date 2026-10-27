import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectedAccount } from './entities/connected-account.entity';
import { SocialAccount } from './entities/social-account.entity';
import { OAuthToken } from './entities/oauth-token.entity';
import { Platform } from '../database/entities/platform.entity';
import { ActivityLog } from '../users/entities/activity-log.entity';
import { WorkspaceMember } from '../workspace-members/entities/workspace-member.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { SocialService } from './services/social.service';
import { SocialController } from './controllers/social.controller';
import {
  FacebookController,
  AuthFacebookController,
  SocialAccountsFacebookController,
  FacebookLiveController,
} from './controllers/facebook.controller';
import { FacebookService } from './services/facebook.service';
import { FacebookProvider } from './providers/facebook.provider';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { LoggerModule } from '../logger/logger.module';

// Legacy Platform Services
import { YoutubeService } from './platforms/youtube/youtube.service';
import { FacebookService as LegacyFacebookService } from './platforms/facebook/facebook.service';
import { InstagramService } from './platforms/instagram/instagram.service';

import { LinkedinService } from './platforms/linkedin/linkedin.service';
import { TwitterService } from './platforms/twitter/twitter.service';
import { TwitchService } from './platforms/twitch/twitch.service';
import { TiktokService } from './platforms/tiktok/tiktok.service';

import { SocialAnalyticsSnapshot } from '../dashboard/entities/social-analytics-snapshot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConnectedAccount,
      SocialAccount,
      OAuthToken,
      Platform,
      ActivityLog,
      WorkspaceMember,
      Workspace,
      SocialAnalyticsSnapshot,
    ]),
    SubscriptionsModule,
    LoggerModule,
  ],
  controllers: [
    SocialController,
    FacebookController,
    AuthFacebookController,
    SocialAccountsFacebookController,
    FacebookLiveController,
  ],
  providers: [
    SocialService,
    FacebookService,
    FacebookProvider,
    FacebookStrategy,
    YoutubeService,
    LegacyFacebookService,
    InstagramService,
    LinkedinService,
    TwitterService,
    TwitchService,
    TiktokService,
  ],
  exports: [
    SocialService,
    FacebookService,
    FacebookProvider,
    FacebookStrategy,
    TypeOrmModule,
  ],
})
export class SocialModule {}
