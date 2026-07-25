import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { OAuthToken } from './oauth-token.entity';

export enum AccountStatus {
  CONNECTED = 'CONNECTED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
  SYNCING = 'SYNCING',
}

@Entity('connected_accounts')
export class ConnectedAccount extends BaseEntity {
  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @Column({ name: 'platform_name' })
  platformName: string; // 'YOUTUBE', 'FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'TWITTER', 'TWITCH', 'TIKTOK'

  @Column({ name: 'platform_user_id' })
  platformUserId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: AccountStatus.CONNECTED,
  })
  status: AccountStatus;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @OneToOne(() => OAuthToken, (token) => token.connectedAccount, {
    cascade: true,
  })
  token: OAuthToken;
}
