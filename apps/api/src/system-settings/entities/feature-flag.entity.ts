import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('feature_flags')
export class FeatureFlag extends BaseEntity {
  @Column({ unique: true })
  name: string; // e.g. AI_CAPTIONS, LIVE_STREAMING, TIKTOK_SUPPORT, BETA_DASHBOARD

  @Column({ name: 'is_enabled', default: true })
  isEnabled: boolean;

  @Column({ nullable: true })
  description?: string;
}
