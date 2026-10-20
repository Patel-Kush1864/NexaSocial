import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { StripeGateway } from './gateways/stripe.gateway';
import { RazorpayGateway } from './gateways/razorpay.gateway';
import { PlansModule } from '../plans/plans.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { ActivityLog } from '../users/entities/activity-log.entity';
import { LoggerModule } from '../logger/logger.module';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, ActivityLog, Workspace]),
    PlansModule,
    forwardRef(() => SubscriptionsModule),
    LoggerModule,
    MailModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeGateway, RazorpayGateway],
  exports: [PaymentsService],
})
export class PaymentsModule {}
