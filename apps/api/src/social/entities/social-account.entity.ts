import { Entity, Column, CreateDateColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum SocialAccountStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  ERROR = 'ERROR',
}

@Entity('social_accounts')
export class SocialAccount extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 50 })
  provider: string; // e.g. 'facebook', 'youtube', 'linkedin', 'twitch', 'instagram'

  @Column({ name: 'provider_user_id' })
  providerUserId: string;

  @Column({ name: 'provider_name' })
  providerName: string;

  @Column({ name: 'provider_email', nullable: true })
  providerEmail?: string;

  @Column({ name: 'access_token', type: 'text', nullable: true })
  accessToken?: string;

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken?: string;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt?: Date;

  @Column({ name: 'connected', type: 'boolean', default: true })
  connected: boolean;

  @Column({ name: 'page_id', nullable: true })
  pageId?: string;

  @Column({ name: 'page_name', nullable: true })
  pageName?: string;

  @Column({ name: 'page_access_token', type: 'text', nullable: true })
  pageAccessToken?: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: SocialAccountStatus.CONNECTED,
  })
  status: SocialAccountStatus;

  @CreateDateColumn({ name: 'connected_at' })
  connectedAt: Date;

  // Compatibility getters & setters for existing code
  get providerUserName(): string {
    return this.providerName;
  }
  set providerUserName(val: string) {
    this.providerName = val;
  }

  get userAccessToken(): string | undefined {
    return this.accessToken;
  }
  set userAccessToken(val: string | undefined) {
    this.accessToken = val;
  }

  get userRefreshToken(): string | undefined {
    return this.refreshToken;
  }
  set userRefreshToken(val: string | undefined) {
    this.refreshToken = val;
  }

  get tokenExpiresAt(): Date | undefined {
    return this.expiresAt;
  }
  set tokenExpiresAt(val: Date | undefined) {
    this.expiresAt = val;
  }

  get createdAt(): Date {
    return this.created_at;
  }

  get updatedAt(): Date {
    return this.updated_at;
  }
}
