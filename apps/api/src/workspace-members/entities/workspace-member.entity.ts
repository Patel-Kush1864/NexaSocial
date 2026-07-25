import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { User } from '../../users/entities/user.entity';

export enum WorkspaceRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  CREATOR = 'CREATOR',
  VIEWER = 'VIEWER',
}

@Entity('workspace_members')
export class WorkspaceMember extends BaseEntity {
  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: WorkspaceRole.VIEWER,
  })
  role: WorkspaceRole;

  @Column({
    name: 'joined_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  joinedAt: Date;

  @Column({ name: 'invited_by', nullable: true })
  invitedBy?: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
