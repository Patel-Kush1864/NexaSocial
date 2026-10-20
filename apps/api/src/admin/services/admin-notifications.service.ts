import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import bull from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from '../../users/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { WorkspaceMember } from '../../workspace-members/entities/workspace-member.entity';
import {
  Notification,
  NotificationPriority,
} from '../../notifications/entities/notification.entity';
import { AdminAuditLog } from '../../audit/entities/admin-audit-log.entity';
import {
  AdminNotificationPreviewDto,
  AdminNotificationSendDto,
  NotificationTargetType,
  AdminGetNotificationsDto,
} from '../dto/admin-notification.dto';
import { NotificationGateway } from '../../notifications/websocket/notification.gateway';

@Injectable()
export class AdminNotificationsService {
  private readonly logger = new Logger(AdminNotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
    @InjectRepository(AdminAuditLog)
    private readonly auditLogRepository: Repository<AdminAuditLog>,
    @InjectQueue('notification-broadcast-jobs')
    private readonly broadcastQueue: bull.Queue,
    private readonly notificationGateway: NotificationGateway,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async previewNotification(dto: AdminNotificationPreviewDto) {
    let recipientCount = 0;
    const isBroadcast =
      dto.targetType === NotificationTargetType.ALL_USERS ||
      dto.targetType === NotificationTargetType.ALL_WORKSPACES;

    if (dto.targetType === NotificationTargetType.ALL_USERS) {
      recipientCount = await this.userRepository.count({
        where: { isActive: true },
      });
    } else if (dto.targetType === NotificationTargetType.ALL_WORKSPACES) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await this.workspaceMemberRepository
        .createQueryBuilder('wm')
        .select('COUNT(DISTINCT wm.user_id)', 'count')
        .getRawOne();
      recipientCount = parseInt(result.count || '0', 10);
    } else if (dto.targetType === NotificationTargetType.SPECIFIC_USER) {
      if (!dto.targetUserId)
        throw new BadRequestException('targetUserId is required');
      const user = await this.userRepository.findOne({
        where: { id: dto.targetUserId },
      });
      if (!user) throw new NotFoundException('Target user not found');
      recipientCount = 1;
    } else if (dto.targetType === NotificationTargetType.SPECIFIC_WORKSPACE) {
      if (!dto.targetWorkspaceId)
        throw new BadRequestException('targetWorkspaceId is required');
      const workspace = await this.workspaceRepository.findOne({
        where: { id: dto.targetWorkspaceId },
      });
      if (!workspace) throw new NotFoundException('Target workspace not found');
      recipientCount = await this.workspaceMemberRepository.count({
        where: { workspaceId: dto.targetWorkspaceId },
      });
    }

    return {
      valid: true,
      broadcast: isBroadcast,
      targetType: dto.targetType,
      recipientCount,
      type: dto.type,
      title: dto.title,
      message: dto.message,
    };
  }

  async sendNotification(dto: AdminNotificationSendDto, adminId: string) {
    // Validate target
    const preview = await this.previewNotification(dto);

    if (preview.broadcast) {
      // Queue the broadcast
      const job = await this.broadcastQueue.add({
        type: dto.type,
        title: dto.title,
        message: dto.message,
        targetType: dto.targetType,
      });

      await this.auditLogRepository.save(
        this.auditLogRepository.create({
          adminUserId: adminId,
          action: 'NOTIFICATION_BROADCAST_SENT',
          module: 'NOTIFICATIONS',
          targetId: job.id.toString(),
          metadata: {
            targetType: dto.targetType,
            recipientCount: preview.recipientCount,
            notificationType: dto.type,
          },
        }),
      );

      this.eventEmitter.emit('admin.notification.sent', {
        adminId,
        action: 'NOTIFICATION_BROADCAST_SENT',
        metadata: {
          targetType: dto.targetType,
          recipientCount: preview.recipientCount,
          notificationType: dto.type,
        },
      });

      return {
        status: 'QUEUED',
        broadcast: true,
        recipientCount: preview.recipientCount,
        jobId: job.id,
      };
    } else {
      // Send synchronously for specific targets
      const notifications: Notification[] = [];

      if (dto.targetType === NotificationTargetType.SPECIFIC_USER) {
        notifications.push(
          this.notificationRepository.create({
            userId: dto.targetUserId!,
            type: dto.type,
            title: dto.title,
            message: dto.message,
            priority: NotificationPriority.HIGH,
            isRead: false,
          }),
        );
      } else if (dto.targetType === NotificationTargetType.SPECIFIC_WORKSPACE) {
        const members = await this.workspaceMemberRepository.find({
          where: { workspaceId: dto.targetWorkspaceId! },
          select: ['userId'],
        });

        members.forEach((member) => {
          notifications.push(
            this.notificationRepository.create({
              userId: member.userId,
              workspaceId: dto.targetWorkspaceId!,
              type: dto.type,
              title: dto.title,
              message: dto.message,
              priority: NotificationPriority.HIGH,
              isRead: false,
            }),
          );
        });
      }

      await this.notificationRepository.save(notifications);

      // Dispatch WebSockets
      notifications.forEach((n) => {
        this.notificationGateway.emitNewNotification(n.userId, n);
      });

      await this.auditLogRepository.save(
        this.auditLogRepository.create({
          adminUserId: adminId,
          action: 'NOTIFICATION_SENT',
          module: 'NOTIFICATIONS',
          metadata: {
            targetType: dto.targetType,
            recipientCount: preview.recipientCount,
            notificationType: dto.type,
          },
        }),
      );

      this.eventEmitter.emit('admin.notification.sent', {
        adminId,
        action: 'NOTIFICATION_SENT',
        metadata: {
          targetType: dto.targetType,
          recipientCount: preview.recipientCount,
          notificationType: dto.type,
        },
      });

      return {
        status: 'SENT',
        broadcast: false,
        recipientCount: preview.recipientCount,
      };
    }
  }

  async getNotificationHistory(query: AdminGetNotificationsDto) {
    const page =
      typeof query.page === 'number'
        ? query.page
        : parseInt((query.page as unknown as string) || '1', 10);
    const limit =
      typeof query.limit === 'number'
        ? query.limit
        : parseInt((query.limit as unknown as string) || '20', 10);
    const offset = (page - 1) * limit;

    const qb = this.notificationRepository
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.user', 'user')
      .leftJoinAndSelect('n.workspace', 'workspace');

    if (query.type) {
      qb.andWhere('n.type = :type', { type: query.type });
    }

    if (query.search) {
      qb.andWhere('(n.title ILIKE :search OR n.message ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const validSortFields: Record<string, string> = {
      createdAt: 'n.created_at',
      updatedAt: 'n.updated_at',
      type: 'n.type',
      status: 'n.status',
    };
    const sortField =
      query.sortBy && validSortFields[query.sortBy]
        ? validSortFields[query.sortBy]
        : 'n.created_at';
    const sortOrder = query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    qb.orderBy(sortField, sortOrder).take(limit).skip(offset);

    const [items, total] = await qb.getManyAndCount();

    const mappedData = items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      priority: n.priority,
      isRead: n.isRead,
      createdAt: n.created_at,
      user: n.user
        ? {
            id: n.user.id,
            name:
              `${n.user.firstName || ''} ${n.user.lastName || ''}`.trim() ||
              'Unknown',
            email: n.user.email,
          }
        : null,
      workspace: n.workspace
        ? {
            id: n.workspace.id,
            name: n.workspace.name,
          }
        : null,
    }));

    return {
      data: mappedData,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getNotificationStatistics() {
    const total = await this.notificationRepository.count();

    // Using simple aggregations based on existing schema
    const typeDistribution = await this.notificationRepository
      .createQueryBuilder('n')
      .select('n.type', 'type')
      .addSelect('COUNT(n.id)', 'count')
      .groupBy('n.type')
      .getRawMany();

    const unreadCount = await this.notificationRepository.count({
      where: { isRead: false },
    });
    const readCount = await this.notificationRepository.count({
      where: { isRead: true },
    });

    // Broadcast count from audit logs
    const broadcastCount = await this.auditLogRepository.count({
      where: { action: 'NOTIFICATION_BROADCAST_SENT' },
    });

    return {
      total,
      unread: unreadCount,
      read: readCount,
      broadcasts: broadcastCount,
      distribution: typeDistribution,
    };
  }
}
