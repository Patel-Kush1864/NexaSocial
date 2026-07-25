import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import type { User } from './user.entity';

@Entity('user_sessions')
export class UserSession extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne('User', 'sessions', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'refresh_token_hash' })
  refreshTokenHash: string;

  @Column({ nullable: true })
  device?: string;

  @Column({ nullable: true })
  browser?: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'expires_at' })
  expiresAt: Date;
}
