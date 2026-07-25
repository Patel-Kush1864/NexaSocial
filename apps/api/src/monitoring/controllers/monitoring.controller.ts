import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { MonitoringService } from '../services/monitoring.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('monitoring')
@UseGuards(JwtAuthGuard)
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('health')
  async getHealth() {
    return this.monitoringService.getHealthStatus();
  }

  @Post('trigger')
  async triggerMonitoring() {
    await this.monitoringService.monitorActiveStreams();
    return { triggered: true };
  }
}
