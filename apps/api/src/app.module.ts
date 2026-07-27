import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';
import { MailModule } from './mail/mail.module';
import { StorageModule } from './storage/storage.module';
import { QueueModule } from './queue/queue.module';
import { CacheModule } from './cache/cache.module';
import { HealthModule } from './health/health.module';
import { CommonModule } from './common/common.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerMiddleware } from './logger/logger.middleware';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PlansModule } from './plans/plans.module';
import { PaymentsModule } from './payments/payments.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { WorkspaceMembersModule } from './workspace-members/workspace-members.module';
import { InvitationsModule } from './invitations/invitations.module';
import { SocialModule } from './social/social.module';
import { LiveStreamsModule } from './livestreams/livestreams.module';
import { StreamPlatformsModule } from './stream-platforms/stream-platforms.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ActivityModule } from './activity/activity.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditModule } from './audit/audit.module';
import { SystemSettingsModule } from './system-settings/system-settings.module';
import { ReportsModule } from './reports/reports.module';
import { AdminModule } from './admin/admin.module';

@Module({
  // imports: [
  //   ConfigModule,
  //   DatabaseModule,
  //   LoggerModule,
  //   MailModule,
  //   StorageModule,
  //   QueueModule,
  //   CacheModule,
  //   HealthModule,
  //   CommonModule,
  //   EventEmitterModule.forRoot(),
  //   AuthModule,
  //   UsersModule,
  //   PlansModule,
  //   PaymentsModule,
  //   SubscriptionsModule,
  //   WorkspacesModule,
  //   WorkspaceMembersModule,
  //   InvitationsModule,
  //   SocialModule,
  //   LiveStreamsModule,
  //   StreamPlatformsModule,
  //   MonitoringModule,
  //   NotificationsModule,
  //   ActivityModule,
  //   DashboardModule,
  //   AuditModule,
  //   SystemSettingsModule,
  //   ReportsModule,
  //   AdminModule,
  // ],
  imports: [ConfigModule, DatabaseModule, LoggerModule, AuthModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
