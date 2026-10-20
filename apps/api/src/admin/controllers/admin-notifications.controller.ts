import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AdminNotificationsService } from '../services/admin-notifications.service';
import {
  AdminNotificationPreviewDto,
  AdminNotificationSendDto,
  AdminGetNotificationsDto,
} from '../dto/admin-notification.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/decorators/permissions.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, AdminGuard, PermissionsGuard)
export class AdminNotificationsController {
  constructor(
    private readonly adminNotificationsService: AdminNotificationsService,
  ) {}

  @Get()
  @RequirePermission('platform.notifications.view')
  async getNotificationHistory(@Query() query: AdminGetNotificationsDto) {
    return this.adminNotificationsService.getNotificationHistory(query);
  }

  @Get('statistics')
  @RequirePermission('platform.notifications.view')
  async getNotificationStatistics() {
    return this.adminNotificationsService.getNotificationStatistics();
  }

  @Post('preview')
  @RequirePermission('platform.notifications.manage')
  async previewNotification(@Body() dto: AdminNotificationPreviewDto) {
    return this.adminNotificationsService.previewNotification(dto);
  }

  @Post('send')
  @RequirePermission('platform.notifications.manage')
  async sendNotification(
    @Body() dto: AdminNotificationSendDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminNotificationsService.sendNotification(dto, adminId);
  }
}
