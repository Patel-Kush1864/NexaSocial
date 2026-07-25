import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export interface WorkspaceSettings {
  language: string;
  defaultPlatform?: string;
  notificationPreferences?: Record<string, boolean>;
}

@Entity('workspaces')
export class Workspace extends BaseEntity {
  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  logo?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: 'ACTIVE' })
  status: string; // 'ACTIVE', 'SUSPENDED'

  @Column({ default: 'UTC' })
  timezone: string;

  @Column({ type: 'json', nullable: true })
  settings?: WorkspaceSettings;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;
}
