import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';

@Entity('activity_logs')
export class ActivityLog extends BaseEntity {
  @Column({ name: 'workspace_id', nullable: true })
  @Index()
  workspaceId?: string;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  userId?: string;

  @Column()
  action: string;

  @Column({ default: 'GENERAL' })
  module: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'entity_type', nullable: true })
  entityType?: string;

  @Column({ name: 'entity_id', nullable: true })
  entityId?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'workspace_id' })
  workspace?: Workspace;

  @BeforeInsert()
  setModuleAndCategory() {
    if (!this.action) return;

    if (this.action.startsWith('USER_')) this.module = 'USER';
    else if (
      this.action.startsWith('WORKSPACE_') ||
      this.action === 'OWNERSHIP_TRANSFERRED' ||
      this.action.includes('MEMBER')
    )
      this.module = 'WORKSPACE';
    else if (
      this.action.startsWith('SUBSCRIPTION_') ||
      this.action.startsWith('PLAN_')
    )
      this.module = 'SUBSCRIPTION';
    else if (this.action.startsWith('PAYMENT_')) this.module = 'PAYMENT';
    else if (this.action.startsWith('SOCIAL_')) this.module = 'SOCIAL';
    else if (this.action.startsWith('STREAM_')) this.module = 'STREAM';
    else if (!this.module || this.module === 'GENERAL') this.module = 'GENERAL';
  }
}
