import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from './entities/workspace.entity';
import { WorkspacesService } from './services/workspaces.service';
import { WorkspacesController } from './controllers/workspaces.controller';
import { WorkspaceMember } from '../workspace-members/entities/workspace-member.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { UsersModule } from '../users/users.module';
import { LoggerModule } from '../logger/logger.module';
import { ActivityLog } from '../users/entities/activity-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workspace, WorkspaceMember, ActivityLog]),
    SubscriptionsModule,
    UsersModule,
    LoggerModule,
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService, TypeOrmModule],
})
export class WorkspacesModule {}
