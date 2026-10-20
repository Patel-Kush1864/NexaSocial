import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/decorators/permissions.decorator';
import { AdminSocialPlatformsService } from '../services/admin-social-platforms.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../../auth/interfaces/current-user.interface';
import {
  GetAuditMeta,
  AuditMeta,
} from '../../audit/decorators/audit-meta.decorator';

@Controller('admin/social-platforms')
@UseGuards(JwtAuthGuard, AdminGuard, PermissionsGuard)
export class AdminSocialPlatformsController {
  constructor(
    private readonly adminSocialPlatformsService: AdminSocialPlatformsService,
  ) {}

  @Get()
  @RequirePermission('platform.social_platforms.view')
  async findAll() {
    return this.adminSocialPlatformsService.findAll();
  }

  @Get(':id')
  @RequirePermission('platform.social_platforms.view')
  async findOne(@Param('id') id: string) {
    return this.adminSocialPlatformsService.findOne(id);
  }

  @Get(':id/health')
  @RequirePermission('platform.social_platforms.view')
  async getHealth(@Param('id') id: string) {
    return this.adminSocialPlatformsService.getHealth(id);
  }

  @Get(':id/statistics')
  @RequirePermission('platform.social_platforms.view')
  async getStatistics(@Param('id') id: string) {
    return this.adminSocialPlatformsService.getStatistics(id);
  }

  @Get(':id/errors')
  @RequirePermission('platform.social_platforms.view')
  async getErrors(@Param('id') id: string, @Query() query: any) {
    return this.adminSocialPlatformsService.getErrors(id, query);
  }

  @Patch(':id/status')
  @RequirePermission('platform.social_platforms.manage')
  async updateStatus(
    @Param('id') id: string,
    @Body('enabled') enabled: boolean,
    @CurrentUser() user: CurrentUserType,
    @GetAuditMeta() auditMeta: AuditMeta,
  ) {
    return this.adminSocialPlatformsService.updateStatus(
      id,
      enabled,
      user.id,
      auditMeta,
    );
  }
}
