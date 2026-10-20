import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { WorkspaceMember } from '../../workspace-members/entities/workspace-member.entity';
import {
  Notification,
  NotificationType,
  NotificationPriority,
} from '../../notifications/entities/notification.entity';
import { NotificationGateway } from '../../notifications/websocket/notification.gateway';

export interface NotificationBroadcastJobData {
  type: NotificationType;
  title: string;
  message: string;
  targetType: 'ALL_USERS' | 'ALL_WORKSPACES';
}

@Processor('notification-broadcast-jobs')
export class NotificationBroadcastProcessor {
  private readonly logger = new Logger(NotificationBroadcastProcessor.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  @Process()
  async handleBroadcast(job: Job<NotificationBroadcastJobData>) {
    this.logger.log(`Starting broadcast job ${job.id}`);
    const { type, title, message, targetType } = job.data;

    const BATCH_SIZE = 1000;
    let offset = 0;
    let totalProcessed = 0;

    try {
      if (targetType === 'ALL_USERS') {
        while (true) {
          const users = await this.userRepository.find({
            where: { isActive: true },
            select: ['id'],
            take: BATCH_SIZE,
            skip: offset,
          });

          if (users.length === 0) break;

          const notifications = users.map((user) =>
            this.notificationRepository.create({
              userId: user.id,
              type,
              title,
              message,
              priority: NotificationPriority.HIGH,
              isRead: false,
            }),
          );

          await this.notificationRepository.save(notifications, { chunk: 500 });

          // Dispatch websocket events
          notifications.forEach((n) => {
            this.notificationGateway.emitNewNotification(n.userId, n);
          });

          totalProcessed += users.length;
          offset += BATCH_SIZE;
        }
      } else if (targetType === 'ALL_WORKSPACES') {
        while (true) {
          const distinctUserIds = await this.workspaceMemberRepository
            .createQueryBuilder('wm')
            .select('DISTINCT wm.user_id', 'userId')
            .take(BATCH_SIZE)
            .skip(offset)
            .getRawMany();

          if (distinctUserIds.length === 0) break;

          const notifications = distinctUserIds.map((row) =>
            this.notificationRepository.create({
              userId: row.userId,
              type,
              title,
              message,
              priority: NotificationPriority.HIGH,
              isRead: false,
            }),
          );

          await this.notificationRepository.save(notifications, { chunk: 500 });

          // Dispatch websocket events
          notifications.forEach((n) => {
            this.notificationGateway.emitNewNotification(n.userId, n);
          });

          totalProcessed += distinctUserIds.length;
          offset += BATCH_SIZE;
        }
      }

      this.logger.log(
        `Finished broadcast job ${job.id}. Processed ${totalProcessed} recipients.`,
      );
    } catch (error) {
      this.logger.error(`Error processing broadcast job ${job.id}`, error);
      throw error;
    }
  }
}
