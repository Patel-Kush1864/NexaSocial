import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserSession } from './entities/user-session.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { UsersRepository } from './repositories/users.repository';
import { ProfileService } from './services/profile.service';
import { SessionService } from './services/session.service';
import { ProfileController } from './controllers/profile.controller';
import { SessionController } from './controllers/session.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, UserSession, ActivityLog]),
    SubscriptionsModule,
  ],
  controllers: [ProfileController, SessionController, UsersController],
  providers: [UsersService, UsersRepository, ProfileService, SessionService],
  exports: [UsersService, UsersRepository, ProfileService, SessionService],
})
export class UsersModule {}
