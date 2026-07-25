import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { User } from '../../users/entities/user.entity';
import { WorkspaceRole } from '../../workspace-members/entities/workspace-member.entity';

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

@Entity('workspace_invitations')
export class Invitation extends BaseEntity {
  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @Column()
  email: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: WorkspaceRole.VIEWER,
  })
  role: WorkspaceRole;

  @Column({ unique: true })
  token: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'invited_by_id' })
  invitedById: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invited_by_id' })
  invitedBy: User;
}
