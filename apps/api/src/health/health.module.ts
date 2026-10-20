import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthCheck } from './entities/health-check.entity';
import { SystemHealthService } from './services/system-health.service';
import { SystemHealthController } from './controllers/system-health.controller';
import { BullModule } from '@nestjs/bull';
import { HealthMonitorProcessor } from './processors/health-monitor.processor';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([HealthCheck]),
    BullModule.registerQueue({ name: 'token-refresh-jobs' }), // reusing token-refresh for bull queue injection
    BullModule.registerQueue({ name: 'health-monitor-jobs' }), // new queue for this specific processor
    ConfigModule,
  ],
  controllers: [SystemHealthController],
  providers: [SystemHealthService, HealthMonitorProcessor],
  exports: [SystemHealthService],
})
export class HealthModule {}
