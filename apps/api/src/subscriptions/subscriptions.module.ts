import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSubscription } from './entities/user-subscription.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { PlansModule } from '../plans/plans.module';
import { PaymentsModule } from '../payments/payments.module';
import { UsageLimitService } from './services/usage-limit.service';
import { FeatureAccessGuard } from './guards/feature-access.guard';
import { SubscriptionGuard } from './guards/subscription.guard';
import { ActivityLog } from '../users/entities/activity-log.entity';
import { LoggerModule } from '../logger/logger.module';
import { MailModule } from '../mail/mail.module';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { WorkspaceMember } from '../workspace-members/entities/workspace-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserSubscription,
      ActivityLog,
      Workspace,
      WorkspaceMember,
    ]),
    PlansModule,
    forwardRef(() => PaymentsModule),
    LoggerModule,
    MailModule,
  ],
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionsService,
    UsageLimitService,
    FeatureAccessGuard,
    SubscriptionGuard,
  ],
  exports: [
    SubscriptionsService,
    UsageLimitService,
    FeatureAccessGuard,
    SubscriptionGuard,
  ],
})
export class SubscriptionsModule {}
