import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { LiveStream } from '../livestreams/entities/livestream.entity';
import { ConnectedAccount } from '../social/entities/connected-account.entity';
import { UserSubscription } from '../subscriptions/entities/user-subscription.entity';
import { Payment } from '../payments/entities/payment.entity';
import { ReportsService } from './services/reports.service';
import { ReportsController } from './controllers/reports.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Workspace,
      LiveStream,
      ConnectedAccount,
      UserSubscription,
      Payment,
    ]),
    AuditModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
