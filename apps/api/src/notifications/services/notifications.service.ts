/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Notification } from '../entities/notification.entity';
import { CreateNotificationDto } from '../dto/notification.dto';
import { NotificationGateway } from '../websocket/notification.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repository: Repository<Notification>,
    private readonly gateway: NotificationGateway,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.repository.create({
      userId: dto.userId,
      workspaceId: dto.workspaceId,
      title: dto.title,
      message: dto.message,
      type: dto.type,
      priority: dto.priority,
      metadata: dto.metadata,
      isRead: false,
    });

    const saved = await this.repository.save(notification);

    // Push via WebSockets
    this.gateway.emitNewNotification(saved.userId, saved);

    // Emit Domain Event
    this.eventEmitter.emit('notification.created', saved);

    return saved;
  }

  async getUserNotifications(
    userId: string,
    workspaceId?: string,
    isRead?: boolean,
    limit = 20,
    offset = 0,
  ): Promise<{ data: Notification[]; total: number }> {
    const query = this.repository
      .createQueryBuilder('n')
      .where('n.userId = :userId', { userId });

    if (workspaceId) {
      query.andWhere('n.workspaceId = :workspaceId', { workspaceId });
    }

    if (isRead !== undefined) {
      query.andWhere('n.isRead = :isRead', { isRead });
    }

    query.orderBy('n.created_at', 'DESC').take(limit).skip(offset);

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async getUnreadCount(userId: string, workspaceId?: string): Promise<number> {
    const where: any = { userId, isRead: false };
    if (workspaceId) where.workspaceId = workspaceId;
    return this.repository.count({ where });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.repository.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    const updated = await this.repository.save(notification);

    this.eventEmitter.emit('notification.read', updated);
    return updated;
  }

  async markAllAsRead(
    userId: string,
    workspaceId?: string,
  ): Promise<{ success: boolean }> {
    const where: any = { userId, isRead: false };
    if (workspaceId) where.workspaceId = workspaceId;

    await this.repository.update(where, { isRead: true });

    this.eventEmitter.emit('notification.readAll', { userId, workspaceId });
    return { success: true };
  }

  async delete(id: string, userId: string): Promise<void> {
    const notification = await this.repository.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    await this.repository.softDelete(id);
  }
}
