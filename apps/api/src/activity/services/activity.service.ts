/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ActivityLog } from '../entities/activity-log.entity';
import { CreateActivityDto, QueryActivityDto } from '../dto/activity.dto';

function sanitizeMetadata(metadata: any): any {
  if (!metadata) return metadata;
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'key',
    'cvv',
    'card',
    'auth',
  ];
  const sanitize = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(sanitize);
    if (obj !== null && typeof obj === 'object') {
      const result: any = {};
      for (const [k, v] of Object.entries(obj)) {
        if (sensitiveKeys.some((sk) => k.toLowerCase().includes(sk))) {
          result[k] = '[REDACTED]';
        } else {
          result[k] = typeof v === 'object' ? sanitize(v) : v;
        }
      }
      return result;
    }
    return obj;
  };
  return sanitize(metadata);
}

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
      entityType: dto.entityType,
      entityId: dto.entityId,
    });

    const saved = await this.repository.save(activity);
    this.eventEmitter.emit('activity.logged', saved);
    return saved;
  }

  @OnEvent('admin.notification.sent')
  async handleAdminNotificationSent(payload: {
    adminId: string;
    action: string;
    metadata: any;
  }) {
    let description = 'Admin sent a notification';
    if (payload.action === 'NOTIFICATION_BROADCAST_SENT') {
      description = `Admin sent a notification broadcast to ${payload.metadata.targetType === 'ALL_USERS' ? 'all users' : 'all workspaces'}`;
    }

    await this.logActivity({
      userId: payload.adminId,
      action: payload.action,
      module: 'NOTIFICATIONS',
      description,
      metadata: payload.metadata,
    });
  }

  async getPlatformActivity(
    queryDto: QueryActivityDto,
  ): Promise<{ data: any[]; total: number }> {
    const {
      module: category,
      limit = 20,
      offset = 0,
      search,
      eventType,
      actorId,
      workspaceId,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = queryDto;

    const query = this.repository
      .createQueryBuilder('a')
      .leftJoin('a.user', 'user')
      .leftJoin('a.workspace', 'workspace')
      .select([
        'a.id',
        'a.action',
        'a.module',
        'a.description',
        'a.metadata',
        'a.entityType',
        'a.entityId',
        'a.created_at',
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
        'workspace.id',
        'workspace.name',
      ]);

    if (category && category.toUpperCase() !== 'ALL') {
      query.andWhere('a.module = :category', {
        category: category.toUpperCase(),
      });
    }

    if (eventType) {
      query.andWhere('a.action = :eventType', { eventType });
    }

    if (actorId) {
      query.andWhere('a.userId = :actorId', { actorId });
    }

    if (workspaceId) {
      query.andWhere('a.workspaceId = :workspaceId', { workspaceId });
    }

    if (dateFrom) {
      query.andWhere('a.created_at >= :dateFrom', {
        dateFrom: new Date(dateFrom),
      });
    }

    if (dateTo) {
      query.andWhere('a.created_at <= :dateTo', { dateTo: new Date(dateTo) });
    }

    if (search) {
      query.andWhere(
        '(LOWER(a.description) LIKE LOWER(:search) OR LOWER(a.action) LIKE LOWER(:search) OR LOWER(user.firstName) LIKE LOWER(:search) OR LOWER(user.lastName) LIKE LOWER(:search) OR LOWER(workspace.name) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    const validSortFields: Record<string, string> = {
      createdAt: 'a.created_at',
      action: 'a.action',
      category: 'a.module',
    };
    const sortField =
      sortBy && validSortFields[sortBy]
        ? validSortFields[sortBy]
        : 'a.created_at';
    const order = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query.orderBy(sortField, order).take(limit).skip(offset);

    const [raw, total] = await query.getManyAndCount();

    const data = raw.map((act) => ({
      id: act.id,
      action: act.action,
      module: act.module,
      description: act.description,
      metadata: sanitizeMetadata(act.metadata),
      entityType: act.entityType,
      entityId: act.entityId,
      created_at: act.created_at,
      user: act.user
        ? {
            id: act.user.id,
            name:
              `${act.user.firstName || ''} ${act.user.lastName || ''}`.trim() ||
              'Unknown',
            email: act.user.email,
          }
        : null,
      workspace: act.workspace
        ? { id: act.workspace.id, name: act.workspace.name }
        : null,
    }));

    return { data, total };
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

  async getPlatformActivityById(id: string): Promise<any> {
    const query = this.repository
      .createQueryBuilder('a')
      .leftJoin('a.user', 'user')
      .leftJoin('a.workspace', 'workspace')
      .select([
        'a.id',
        'a.action',
        'a.module',
        'a.description',
        'a.metadata',
        'a.entityType',
        'a.entityId',
        'a.created_at',
        'user.id',
        'user.name',
        'user.email',
        'workspace.id',
        'workspace.name',
      ])
      .where('a.id = :id', { id });

    const act = await query.getOne();

    if (!act) {
      return null;
    }

    return {
      id: act.id,
      action: act.action,
      module: act.module,
      description: act.description,
      metadata: sanitizeMetadata(act.metadata),
      entityType: act.entityType,
      entityId: act.entityId,
      created_at: act.created_at,
      user: act.user
        ? {
            id: act.user.id,
            name:
              `${act.user.firstName || ''} ${act.user.lastName || ''}`.trim() ||
              'Unknown',
            email: act.user.email,
          }
        : null,
      workspace: act.workspace
        ? { id: act.workspace.id, name: act.workspace.name }
        : null,
    };
  }
}
