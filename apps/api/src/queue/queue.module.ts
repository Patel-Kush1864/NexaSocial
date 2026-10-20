import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SubscriptionExpiryProcessor } from './processors/subscription-expiry.processor';
import { TokenRefreshProcessor } from './processors/token-refresh.processor';
import { ProfileSyncProcessor } from './processors/profile-sync.processor';
import { LiveStreamSchedulerProcessor } from './processors/livestream-scheduler.processor';
import { LiveStreamMonitorProcessor } from './processors/livestream-monitor.processor';
import { NotificationBroadcastProcessor } from './processors/notification-broadcast.processor';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SocialModule } from '../social/social.module';
import { LiveStreamsModule } from '../livestreams/livestreams.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { WorkspaceMembersModule } from '../workspace-members/workspace-members.module';

import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { WorkspaceMember } from '../workspace-members/entities/workspace-member.entity';
import { Notification } from '../notifications/entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, WorkspaceMember, Notification]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host:
            configService.get<string>('redis.host') ||
            process.env.REDIS_HOST ||
            'localhost',
          port:
            configService.get<number>('redis.port') ||
            parseInt(process.env.REDIS_PORT || '6379', 10),
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'subscription-jobs' },
      { name: 'token-refresh-jobs' },
      { name: 'profile-sync-jobs' },
      { name: 'livestream-scheduler-jobs' },
      { name: 'livestream-monitor-jobs' },
      { name: 'notification-broadcast-jobs' },
      { name: 'email-jobs' },
    ),
    SubscriptionsModule,
    SocialModule,
    LiveStreamsModule,
    MonitoringModule,
    NotificationsModule,
    UsersModule,
    WorkspaceMembersModule,
  ],
  providers: [
    SubscriptionExpiryProcessor,
    TokenRefreshProcessor,
    ProfileSyncProcessor,
    LiveStreamSchedulerProcessor,
    LiveStreamMonitorProcessor,
    NotificationBroadcastProcessor,
  ],
  exports: [BullModule],
})
export class QueueModule {}
