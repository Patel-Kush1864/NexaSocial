import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';

export enum NotificationType {
  STREAM_STARTED = 'STREAM_STARTED',
  STREAM_ENDED = 'STREAM_ENDED',
  STREAM_FAILED = 'STREAM_FAILED',
  WORKSPACE_INVITATION = 'WORKSPACE_INVITATION',
  SUBSCRIPTION_RENEWAL = 'SUBSCRIPTION_RENEWAL',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILURE = 'PAYMENT_FAILURE',
  OAUTH_TOKEN_EXPIRED = 'OAUTH_TOKEN_EXPIRED',
  MEMBER_JOINED = 'MEMBER_JOINED',
  MEMBER_REMOVED = 'MEMBER_REMOVED',
  GENERAL = 'GENERAL',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'workspace_id', nullable: true })
  @Index()
  workspaceId?: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: NotificationType.GENERAL,
  })
  type: NotificationType;

  @Column({
    type: 'varchar',
    length: 20,
    default: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'workspace_id' })
  workspace?: Workspace;
}
