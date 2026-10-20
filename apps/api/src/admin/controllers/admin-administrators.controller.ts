import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AdminAdministratorsService } from '../services/admin-administrators.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/decorators/permissions.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../../auth/interfaces/current-user.interface';
import {
  GetAuditMeta,
  AuditMeta,
} from '../../audit/decorators/audit-meta.decorator';

@Controller('admin/administrators')
@UseGuards(JwtAuthGuard, AdminGuard, PermissionsGuard)
export class AdminAdministratorsController {
  constructor(private readonly service: AdminAdministratorsService) {}

  @Get()
  @RequirePermission('platform.administrators.view')
  async getAdministrators(
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('role') role?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;
    return this.service.getAdministrators(
      limit,
      offset,
      search,
      status,
      role,
      sortBy,
      sortOrder,
    );
  }

  @Get(':id')
  @RequirePermission('platform.administrators.view')
  async getAdministratorById(@Param('id') id: string) {
    return this.service.getAdministratorById(id);
  }

  @Post()
  @RequirePermission('platform.administrators.manage')
  async createAdministrator(
    @CurrentUser() user: CurrentUserType,
    @Body()
    dto: {
      email: string;
      firstName?: string;
      lastName?: string;
      roleName: string;
      status?: string;
    },
    @GetAuditMeta() auditMeta: AuditMeta,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    if (user.role !== 'SUPER_ADMIN')
      throw new BadRequestException(
        'Only SUPER_ADMIN can manage administrators',
      );

    return this.service.createAdministrator(dto, user.id, auditMeta);
  }

  @Patch(':id/role')
  @RequirePermission('platform.administrators.manage')
  async updateAdministratorRole(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: { role: string },
    @GetAuditMeta() auditMeta: AuditMeta,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    if (user.role !== 'SUPER_ADMIN')
      throw new BadRequestException(
        'Only SUPER_ADMIN can manage administrators',
      );

    return this.service.updateAdministratorRole(
      id,
      dto.role,
      user.id,
      auditMeta,
    );
  }

  @Patch(':id/status')
  @RequirePermission('platform.administrators.manage')
  async updateAdministratorStatus(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: { status: string },
    @GetAuditMeta() auditMeta: AuditMeta,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    if (user.role !== 'SUPER_ADMIN')
      throw new BadRequestException(
        'Only SUPER_ADMIN can manage administrators',
      );

    return this.service.updateAdministratorStatus(
      id,
      dto.status,
      user.id,
      auditMeta,
    );
  }
}
