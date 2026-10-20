import {
  Controller,
  Get,
  Query,
  UseGuards,
  DefaultValuePipe,
} from '@nestjs/common';
import { PlatformAnalyticsService } from '../services/platform-analytics.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../admin/guards/admin.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/decorators/permissions.decorator';

@Controller('platform/analytics')
@UseGuards(JwtAuthGuard, AdminGuard, PermissionsGuard)
export class PlatformAnalyticsController {
  constructor(private readonly service: PlatformAnalyticsService) {}

  @Get('users')
  @RequirePermission('platform.reports.view')
  async getUsersAnalytics(
    @Query('range', new DefaultValuePipe('30d')) range: string,
  ) {
    return this.service.getUserAnalytics(range);
  }

  @Get('workspaces')
  @RequirePermission('platform.reports.view')
  async getWorkspacesAnalytics(
    @Query('range', new DefaultValuePipe('30d')) range: string,
  ) {
    return this.service.getWorkspaceAnalytics(range);
  }

  @Get('subscriptions')
  @RequirePermission('platform.reports.view')
  async getSubscriptionsAnalytics(
    @Query('range', new DefaultValuePipe('30d')) range: string,
  ) {
    return this.service.getSubscriptionAnalytics(range);
  }

  @Get('revenue')
  @RequirePermission('platform.reports.view')
  async getRevenueAnalytics(
    @Query('range', new DefaultValuePipe('30d')) range: string,
  ) {
    return this.service.getRevenueAnalytics(range);
  }

  @Get('social-platforms')
  @RequirePermission('platform.social_platforms.view')
  async getSocialPlatformAnalytics() {
    return this.service.getSocialPlatformAnalytics();
  }

  @Get('livestreams')
  @RequirePermission('platform.livestreams.view')
  async getLiveStreamAnalytics() {
    return this.service.getLiveStreamAnalytics();
  }
}
