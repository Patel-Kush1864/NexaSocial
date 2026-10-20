import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('security_events')
export class SecurityEvent extends BaseEntity {
  @Column()
  @Index()
  event: string;

  @Column({ default: 'INFO' })
  severity: string;

  @Column({ name: 'user_email', nullable: true })
  userEmail?: string;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  userId?: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;
}
