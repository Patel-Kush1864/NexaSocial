import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { LiveStream } from '../../livestreams/entities/livestream.entity';
import { ConnectedAccount } from '../../social/entities/connected-account.entity';

export enum StreamPlatformStatus {
  PENDING = 'PENDING',
  LIVE = 'LIVE',
  ENDED = 'ENDED',
  FAILED = 'FAILED',
}

@Entity('stream_platforms')
export class StreamPlatform extends BaseEntity {
  @Column({ name: 'stream_id' })
  streamId: string;

  @Column({ name: 'connected_account_id' })
  connectedAccountId: string;

  @Column({ name: 'stream_key', nullable: true })
  streamKey?: string;

  @Column({ name: 'stream_url', nullable: true })
  streamUrl?: string;

  @Column({ name: 'platform_stream_id', nullable: true })
  platformStreamId?: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: StreamPlatformStatus.PENDING,
  })
  status: StreamPlatformStatus;

  @ManyToOne(() => LiveStream, (stream) => stream.platforms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'stream_id' })
  liveStream: LiveStream;

  @ManyToOne(() => ConnectedAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'connected_account_id' })
  connectedAccount: ConnectedAccount;
}
