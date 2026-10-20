import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('user_email_preferences')
export class UserEmailPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', length: 36, unique: true })
  @Index()
  userId: string;

  @Column({ name: 'streaming_emails', default: true })
  streamingEmails: boolean;

  @Column({ name: 'social_emails', default: true })
  socialEmails: boolean;

  @Column({ name: 'workspace_emails', default: true })
  workspaceEmails: boolean;

  @Column({ name: 'marketing_emails', default: false })
  marketingEmails: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
