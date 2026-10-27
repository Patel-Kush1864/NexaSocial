import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('social_analytics_snapshots')
@Index(['workspaceId', 'snapshotDate'])
export class SocialAnalyticsSnapshot extends BaseEntity {
  @Column({ name: 'workspace_id' })
  @Index()
  workspaceId: string;

  @Column({ name: 'connected_account_id', nullable: true })
  @Index()
  connectedAccountId?: string;

  @Column({ name: 'platform_name', length: 50 })
  platformName: string; // 'YOUTUBE', 'FACEBOOK', 'INSTAGRAM', 'X', 'LINKEDIN', 'TWITCH', 'TIKTOK'

  @Column({ type: 'int', default: 0 })
  followers: number;

  @Column({ type: 'int', default: 0 })
  engagement: number;

  @Column({ name: 'snapshot_date', type: 'date' })
  @Index()
  snapshotDate: string; // 'YYYY-MM-DD'
}
