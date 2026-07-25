import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';

@Entity('activity_logs')
export class ActivityLog extends BaseEntity {
  @Column({ name: 'workspace_id', nullable: true })
  @Index()
  workspaceId?: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column()
  action: string;

  @Column({ default: 'GENERAL' })
  module: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'workspace_id' })
  workspace?: Workspace;
}
