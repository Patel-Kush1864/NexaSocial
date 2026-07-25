import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ConnectedAccount } from './connected-account.entity';

@Entity('oauth_tokens')
export class OAuthToken extends BaseEntity {
  @Column({ name: 'connected_account_id' })
  connectedAccountId: string;

  @Column({ name: 'access_token', type: 'text' })
  accessToken: string;

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken?: string;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'text', nullable: true })
  scope?: string;

  @Column({ name: 'token_type', nullable: true })
  tokenType?: string;

  @OneToOne(() => ConnectedAccount, (account) => account.token, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'connected_account_id' })
  connectedAccount: ConnectedAccount;
}
