import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum EmailStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

@Entity('email_logs')
export class EmailLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  @Index()
  recipient: string;

  @Column({ name: 'user_id', length: 36, nullable: true })
  @Index()
  userId?: string;

  @Column({ name: 'event_type', length: 100 })
  @Index()
  eventType: string;

  @Column({ length: 255 })
  subject: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: EmailStatus.PENDING,
  })
  @Index()
  status: EmailStatus;

  @Column({
    name: 'idempotency_key',
    length: 255,
    nullable: true,
    unique: true,
  })
  @Index()
  idempotencyKey?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @Column({ name: 'sent_at', type: 'datetime', nullable: true })
  sentAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
