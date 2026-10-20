import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './controllers/search.controller';
import { SearchService } from './services/search.service';

// Entities
import { User } from '../users/entities/user.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { LiveStream } from '../livestreams/entities/livestream.entity';
import { ConnectedAccount } from '../social/entities/connected-account.entity';
import { Payment } from '../payments/entities/payment.entity';
import { SystemSetting } from '../system-settings/entities/system-setting.entity';
import { UserSubscription } from '../subscriptions/entities/user-subscription.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Workspace,
      LiveStream,
      ConnectedAccount,
      Payment,
      SystemSetting,
      UserSubscription,
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
