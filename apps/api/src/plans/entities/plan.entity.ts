import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export interface PlanFeatures {
  workspaces: number; // Limit on workspace creation (-1 for unlimited)
  socialAccounts: number; // Limit on connected social channels (-1 for unlimited)
  teamMembers: number; // Limit on team member invitations (-1 for unlimited)
  liveStreaming: boolean; // Flag to enable/disable live streaming
  analytics: boolean; // Flag to enable/disable dashboard analytics
  aiFeatures: boolean; // Flag to enable/disable AI tools
  prioritySupport: boolean; // Flag to indicate priority support
  storageGb: number; // Limit on storage (-1 for unlimited)
  apiAccess: boolean; // Flag to enable/disable API key usage
  customBranding: boolean; // Flag to enable/disable custom branding
  streamScheduling: boolean; // Flag to enable/disable scheduling
  multiPlatformStreaming: boolean; // Flag to stream to multiple destinations simultaneously
}

@Entity('subscription_plans')
export class Plan extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  price: number;

  @Column({ default: 'month' })
  interval: string; // 'month', 'year'

  @Column({ type: 'json', nullable: true })
  features: PlanFeatures;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
