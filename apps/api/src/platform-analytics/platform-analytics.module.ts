import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformAnalyticsController } from './controllers/platform-analytics.controller';
import { PlatformAnalyticsService } from './services/platform-analytics.service';
import { User } from '../users/entities/user.entity';
import { UserSession } from '../users/entities/user-session.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { UserSubscription } from '../subscriptions/entities/user-subscription.entity';
import { Payment } from '../payments/entities/payment.entity';
import { ConnectedAccount } from '../social/entities/connected-account.entity';
import { AuthModule } from '../auth/auth.module';

import { LiveStream } from '../livestreams/entities/livestream.entity';
import { StreamPlatform } from '../stream-platforms/entities/stream-platform.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserSession,
      Workspace,
      UserSubscription,
      Payment,
      ConnectedAccount,
      LiveStream,
      StreamPlatform,
    ]),
    AuthModule,
  ],
  controllers: [PlatformAnalyticsController],
  providers: [PlatformAnalyticsService],
})
export class PlatformAnalyticsModule {}
