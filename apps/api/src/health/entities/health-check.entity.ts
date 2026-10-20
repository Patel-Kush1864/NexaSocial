import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum HealthService {
  API = 'API',
  MYSQL = 'MYSQL',
  REDIS = 'REDIS',
  QUEUE = 'QUEUE',
  STORAGE = 'STORAGE',
  WEBSOCKET = 'WEBSOCKET',
}

export enum HealthStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  UNHEALTHY = 'UNHEALTHY',
  UNKNOWN = 'UNKNOWN',
}

@Entity('health_checks')
export class HealthCheck extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 50,
  })
  service: HealthService;

  @Column({
    type: 'varchar',
    length: 50,
  })
  status: HealthStatus;

  @Column({ name: 'response_time_ms', type: 'int', nullable: true })
  responseTimeMs: number | null;

  @Column({
    name: 'checked_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  checkedAt: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;
}
