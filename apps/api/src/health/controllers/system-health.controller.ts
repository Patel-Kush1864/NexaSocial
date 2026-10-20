import { Controller, Get, UseGuards, Post, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../admin/guards/admin.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/decorators/permissions.decorator';
import { SystemHealthService } from '../services/system-health.service';

@Controller('platform')
@UseGuards(JwtAuthGuard, AdminGuard, PermissionsGuard)
export class SystemHealthController {
  constructor(private readonly systemHealthService: SystemHealthService) {}

  @Get('system-health')
  @RequirePermission('platform.system_health.view')
  async getSystemHealth() {
    return this.systemHealthService.getPlatformHealth();
  }

  // Adding a refresh endpoint to trigger manual refresh
  @Post('system-health/refresh')
  @RequirePermission('platform.system_health.view')
  async refreshSystemHealth() {
    await this.systemHealthService.runAllChecks();
    return this.systemHealthService.getPlatformHealth();
  }

  @Get('system-health/failed-jobs')
  @RequirePermission('platform.system_health.view')
  async getFailedJobs(
    @Query('queue') queue = 'default',
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    return this.systemHealthService.getFailedJobs(queue, p, l);
  }
}
