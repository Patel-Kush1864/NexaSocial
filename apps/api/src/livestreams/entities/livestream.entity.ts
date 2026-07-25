import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { StreamPlatform } from '../../stream-platforms/entities/stream-platform.entity';

export enum StreamStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED',
}

export enum StreamVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  UNLISTED = 'UNLISTED',
}

@Entity('live_streams')
export class LiveStream extends BaseEntity {
  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  thumbnail?: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: StreamVisibility.PUBLIC,
  })
  visibility: StreamVisibility;

  @Column({ name: 'scheduled_at', type: 'timestamp', nullable: true })
  scheduledAt?: Date;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  endedAt?: Date;

  @Column({
    type: 'varchar',
    length: 50,
    default: StreamStatus.DRAFT,
  })
  status: StreamStatus;

  @Column({ name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @OneToMany(() => StreamPlatform, (platform) => platform.liveStream, {
    cascade: true,
  })
  platforms: StreamPlatform[];
}
