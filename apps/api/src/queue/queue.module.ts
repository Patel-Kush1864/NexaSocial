import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SubscriptionExpiryProcessor } from './processors/subscription-expiry.processor';
import { TokenRefreshProcessor } from './processors/token-refresh.processor';
import { ProfileSyncProcessor } from './processors/profile-sync.processor';
import { LiveStreamSchedulerProcessor } from './processors/livestream-scheduler.processor';
import { LiveStreamMonitorProcessor } from './processors/livestream-monitor.processor';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SocialModule } from '../social/social.module';
import { LiveStreamsModule } from '../livestreams/livestreams.module';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
  imports: [
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
    ),
    SubscriptionsModule,
    SocialModule,
    LiveStreamsModule,
    MonitoringModule,
  ],
  providers: [
    SubscriptionExpiryProcessor,
    TokenRefreshProcessor,
    ProfileSyncProcessor,
    LiveStreamSchedulerProcessor,
    LiveStreamMonitorProcessor,
  ],
  exports: [BullModule],
})
export class QueueModule {}
