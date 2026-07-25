import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { Plan } from '../plans/entities/plan.entity';
import { UserSubscription } from '../subscriptions/entities/user-subscription.entity';
import { ConnectedAccount } from '../social/entities/connected-account.entity';
import { LiveStream } from '../livestreams/entities/livestream.entity';
import { Payment } from '../payments/entities/payment.entity';

import { AuditModule } from '../audit/audit.module';

import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Workspace,
      Plan,
      UserSubscription,
      ConnectedAccount,
      LiveStream,
      Payment,
    ]),
    AuditModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
