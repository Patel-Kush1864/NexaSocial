import { Injectable } from '@nestjs/common';
import { DataSource, Repository, FindOptionsWhere } from 'typeorm';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationsRepository extends Repository<Notification> {
  constructor(private readonly dataSource: DataSource) {
    super(Notification, dataSource.createEntityManager());
  }

  async findUserNotifications(
    userId: string,
    workspaceId?: string,
    isRead?: boolean,
    limit = 20,
    offset = 0,
  ): Promise<[Notification[], number]> {
    const where: FindOptionsWhere<Notification> = { userId };
    if (workspaceId) where.workspaceId = workspaceId;
    if (isRead !== undefined) where.isRead = isRead;

    return this.findAndCount({
      where,
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async countUnread(userId: string, workspaceId?: string): Promise<number> {
    const where: FindOptionsWhere<Notification> = { userId, isRead: false };
    if (workspaceId) where.workspaceId = workspaceId;
    return this.count({ where });
  }

  async markAllAsRead(userId: string, workspaceId?: string): Promise<void> {
    const where: FindOptionsWhere<Notification> = { userId, isRead: false };
    if (workspaceId) where.workspaceId = workspaceId;
    await this.update(where, { isRead: true });
  }
}
