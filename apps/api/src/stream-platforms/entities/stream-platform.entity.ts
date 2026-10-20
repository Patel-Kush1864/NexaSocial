import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { LiveStream } from '../../livestreams/entities/livestream.entity';
import { ConnectedAccount } from '../../social/entities/connected-account.entity';

export enum StreamPlatformStatus {
  PENDING = 'PENDING',
  WAITING_FOR_PLATFORM_PREVIEW = 'WAITING_FOR_PLATFORM_PREVIEW',
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

  @Column({ name: 'viewer_url', nullable: true })
  viewerUrl?: string;

  @Column({ name: 'facebook_live_video_id', nullable: true })
  facebookLiveVideoId?: string;

  @Column({ name: 'facebook_page_id', nullable: true })
  facebookPageId?: string;

  @Column({ name: 'source_connected_at', type: 'timestamp', nullable: true })
  sourceConnectedAt?: Date;

  @Column({ name: 'metadata_completed_at', type: 'timestamp', nullable: true })
  metadataCompletedAt?: Date;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt?: Date;

  @Column({
    name: 'source_status',
    type: 'varchar',
    length: 50,
    default: 'DISCONNECTED',
  })
  sourceStatus: string;

  @Column({
    name: 'metadata_status',
    type: 'varchar',
    length: 50,
    default: 'PENDING',
  })
  metadataStatus: string;

  @Column({
    name: 'publish_status',
    type: 'varchar',
    length: 50,
    default: 'IDLE',
  })
  publishStatus: string;

  @Column({ name: 'facebook_last_error', type: 'text', nullable: true })
  facebookLastError?: string;

  @Column({ name: 'facebook_last_error_code', nullable: true })
  facebookLastErrorCode?: string;

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
