import { Entity, Column, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Role } from './role.entity';

@Entity('permissions')
export class Permission extends BaseEntity {
  @Column({ unique: true })
  key: string; // e.g., 'platform.users.view'

  @Column()
  name: string; // e.g., 'View Users'

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  module?: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
