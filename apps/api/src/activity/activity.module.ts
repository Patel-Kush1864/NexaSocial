import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import { ActivityService } from './services/activity.service';
import { ActivityController } from './controllers/activity.controller';
import { ActivityRepository } from './repositories/activity.repository';
import { WorkspaceMember } from '../workspace-members/entities/workspace-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLog, WorkspaceMember])],
  controllers: [ActivityController],
  providers: [ActivityService, ActivityRepository],
  exports: [ActivityService, ActivityRepository, TypeOrmModule],
})
export class ActivityModule {}
