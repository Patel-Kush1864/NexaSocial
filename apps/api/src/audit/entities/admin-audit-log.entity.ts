import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('admin_audit_logs')
export class AdminAuditLog extends BaseEntity {
  @Column({ name: 'admin_user_id' })
  @Index()
  adminUserId: string;

  @Column()
  action: string;

  @Column({ default: 'SYSTEM' })
  module: string;

  @Column({ name: 'target_id', nullable: true })
  targetId?: string;

  @Column({ name: 'target_type', nullable: true })
  @Index()
  targetType?: string;

  @Column({ name: 'target_name', nullable: true })
  targetName?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;

  @Column({ name: 'request_id', nullable: true })
  requestId?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_user_id' })
  adminUser: User;
}
