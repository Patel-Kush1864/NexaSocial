import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { WorkspaceMember } from '../workspace-members/entities/workspace-member.entity';
import { ConnectedAccount } from '../social/entities/connected-account.entity';
import { LiveStream } from '../livestreams/entities/livestream.entity';
import { StreamPlatform } from '../stream-platforms/entities/stream-platform.entity';

import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivityModule } from '../activity/activity.module';

import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';
import { DashboardCacheHelper } from './helpers/dashboard-cache.helper';

// Widgets
import { WorkspaceSummaryWidget } from './widgets/workspace-summary.widget';
import { SubscriptionCardWidget } from './widgets/subscription-card.widget';
import { LiveStreamsWidget } from './widgets/live-streams.widget';
import { NotificationsWidget } from './widgets/notifications.widget';
import { RecentActivityWidget } from './widgets/recent-activity.widget';
import { ConnectedPlatformsWidget } from './widgets/connected-platforms.widget';
import { QuickActionsWidget } from './widgets/quick-actions.widget';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workspace,
      WorkspaceMember,
      ConnectedAccount,
      LiveStream,
      StreamPlatform,
    ]),
    SubscriptionsModule,
    NotificationsModule,
    ActivityModule,
  ],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    DashboardCacheHelper,
    WorkspaceSummaryWidget,
    SubscriptionCardWidget,
    LiveStreamsWidget,
    NotificationsWidget,
    RecentActivityWidget,
    ConnectedPlatformsWidget,
    QuickActionsWidget,
  ],
  exports: [DashboardService],
})
export class DashboardModule {}
