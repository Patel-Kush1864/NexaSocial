import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { WorkspaceMembersService } from './services/workspace-members.service';
import { WorkspaceMembersController } from './controllers/workspace-members.controller';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { ActivityLog } from '../users/entities/activity-log.entity';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceMember, Workspace, ActivityLog]),
    LoggerModule,
  ],
  controllers: [WorkspaceMembersController],
  providers: [WorkspaceMembersService],
  exports: [WorkspaceMembersService, TypeOrmModule],
})
export class WorkspaceMembersModule {}
