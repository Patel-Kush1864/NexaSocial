import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerMiddleware } from './logger/logger.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { AuthModule } from './auth/auth.module';
import { GoogleModule } from './auth/google/google.module';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports/reports.module';
import { SecurityModule } from './security/security.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { WorkspaceMembersModule } from './workspace-members/workspace-members.module';
import { SocialModule } from './social/social.module';
import { LiveStreamsModule } from './livestreams/livestreams.module';
import { SearchModule } from './search/search.module';
import { PlatformAnalyticsModule } from './platform-analytics/platform-analytics.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { QueueModule } from './queue/queue.module';
import { StorageModule } from './storage/storage.module';
import { CacheModule } from './cache/cache.module';
import { StreamPlatformsModule } from './stream-platforms/stream-platforms.module';
import { InvitationsModule } from './invitations/invitations.module';
import { CommonModule } from './common/common.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    LoggerModule,
    EventEmitterModule.forRoot(),
    AuthModule,
    GoogleModule,
    UsersModule,
    ReportsModule,
    SecurityModule,
    SubscriptionsModule,
    WorkspacesModule,
    WorkspaceMembersModule,
    SocialModule,
    LiveStreamsModule,
    SearchModule,
    PlatformAnalyticsModule,
    AdminModule,
    HealthModule,
    DashboardModule,
    QueueModule,
    StorageModule,
    CacheModule,
    StreamPlatformsModule,
    InvitationsModule,
    CommonModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, LoggerMiddleware).forRoutes('*');
  }
}
