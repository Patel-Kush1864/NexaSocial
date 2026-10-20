import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { UserSession } from '../users/entities/user-session.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { Plan } from '../plans/entities/plan.entity';
import { UserSubscription } from '../subscriptions/entities/user-subscription.entity';
import { ConnectedAccount } from '../social/entities/connected-account.entity';
import { LiveStream } from '../livestreams/entities/livestream.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Platform } from '../database/entities/platform.entity';
import { ActivityLog } from '../users/entities/activity-log.entity';
import { WorkspaceMember } from '../workspace-members/entities/workspace-member.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { AdminAuditLog } from '../audit/entities/admin-audit-log.entity';

import { AuditModule } from '../audit/audit.module';
import { CacheModule } from '../cache/cache.module';
import { BullModule } from '@nestjs/bull';
import { NotificationsModule } from '../notifications/notifications.module';

import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';

import { AuthModule } from '../auth/auth.module';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { AdminSocialPlatformsController } from './controllers/admin-social-platforms.controller';
import { AdminSocialPlatformsService } from './services/admin-social-platforms.service';
import { AdminConnectedAccountsController } from './controllers/admin-connected-accounts.controller';
import { AdminConnectedAccountsService } from './services/admin-connected-accounts.service';
import { AdminLiveStreamsController } from './controllers/admin-live-streams.controller';
import { AdminLiveStreamsService } from './services/admin-live-streams.service';
import { AdminNotificationsController } from './controllers/admin-notifications.controller';
import { AdminNotificationsService } from './services/admin-notifications.service';
import { AdminAdministratorsController } from './controllers/admin-administrators.controller';
import { AdminAdministratorsService } from './services/admin-administrators.service';
import { AdminFeatureFlagsController } from './controllers/admin-feature-flags.controller';
import { AdminFeatureFlagsService } from './services/admin-feature-flags.service';
import { FeatureFlag } from '../system-settings/entities/feature-flag.entity';
import { SystemSettingsModule } from '../system-settings/system-settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      Workspace,
      Plan,
      UserSubscription,
      ConnectedAccount,
      LiveStream,
      Payment,
      UserSession,
      Platform,
      ActivityLog,
      WorkspaceMember,
      Notification,
      AdminAuditLog,
      FeatureFlag,
    ]),
    AuditModule,
    CacheModule,
    AuthModule,
    NotificationsModule,
    SystemSettingsModule,
    BullModule.registerQueue({ name: 'notification-broadcast-jobs' }),
  ],
  controllers: [
    AdminController,
    AdminAuthController,
    AdminSocialPlatformsController,
    AdminConnectedAccountsController,
    AdminLiveStreamsController,
    AdminNotificationsController,
    AdminAdministratorsController,
    AdminFeatureFlagsController,
  ],
  providers: [
    AdminService,
    AdminSocialPlatformsService,
    AdminConnectedAccountsService,
    AdminLiveStreamsService,
    AdminNotificationsService,
    AdminAdministratorsService,
    AdminFeatureFlagsService,
  ],
  exports: [AdminService],
})
export class AdminModule {}
