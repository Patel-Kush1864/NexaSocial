import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { LiveStream } from '../livestreams/entities/livestream.entity';
import { ConnectedAccount } from '../social/entities/connected-account.entity';
import { UserSubscription } from '../subscriptions/entities/user-subscription.entity';
import { ReportsService } from './services/reports.service';
import { ReportsController } from './controllers/reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Workspace,
      LiveStream,
      ConnectedAccount,
      UserSubscription,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
