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

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_user_id' })
  adminUser: User;
}
