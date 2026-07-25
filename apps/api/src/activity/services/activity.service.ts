import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ActivityLog } from '../entities/activity-log.entity';
import { CreateActivityDto } from '../dto/activity.dto';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly repository: Repository<ActivityLog>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async logActivity(dto: CreateActivityDto): Promise<ActivityLog> {
    const activity = this.repository.create({
      userId: dto.userId,
      workspaceId: dto.workspaceId,
      action: dto.action,
      module: dto.module || 'GENERAL',
      description: dto.description,
      metadata: dto.metadata,
    });

    const saved = await this.repository.save(activity);
    this.eventEmitter.emit('activity.logged', saved);
    return saved;
  }

  async getRecentActivity(
    userId: string,
    workspaceId?: string,
    limit = 20,
    offset = 0,
  ): Promise<{ data: ActivityLog[]; total: number }> {
    const query = this.repository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.user', 'user');

    if (workspaceId) {
      query.where('a.workspaceId = :workspaceId', { workspaceId });
    } else {
      query.where('a.userId = :userId', { userId });
    }

    query.orderBy('a.created_at', 'DESC').take(limit).skip(offset);

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async getWorkspaceActivity(
    workspaceId: string,
    limit = 20,
    offset = 0,
  ): Promise<{ data: ActivityLog[]; total: number }> {
    const [data, total] = await this.repository.findAndCount({
      where: { workspaceId },
      relations: { user: true },
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { data, total };
  }

  async getUserActivity(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<{ data: ActivityLog[]; total: number }> {
    const [data, total] = await this.repository.findAndCount({
      where: { userId },
      relations: { workspace: true },
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { data, total };
  }
}
