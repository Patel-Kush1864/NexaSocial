import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ActivityLog } from '../entities/activity-log.entity';

@Injectable()
export class ActivityRepository extends Repository<ActivityLog> {
  constructor(private readonly dataSource: DataSource) {
    super(ActivityLog, dataSource.createEntityManager());
  }

  async findWorkspaceActivity(
    workspaceId: string,
    limit = 20,
    offset = 0,
  ): Promise<[ActivityLog[], number]> {
    return this.findAndCount({
      where: { workspaceId },
      relations: { user: true },
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findUserActivity(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<[ActivityLog[], number]> {
    return this.findAndCount({
      where: { userId },
      relations: { workspace: true },
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }
}
