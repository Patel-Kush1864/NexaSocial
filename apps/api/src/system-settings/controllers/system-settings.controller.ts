import {
  Controller,
  Get,
  Put,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SystemSettingsService } from '../services/system-settings.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../admin/guards/admin.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RoleEnum } from '../../auth/constants/roles.constants';
import {
  UpdateSystemSettingDto,
  ToggleFeatureFlagDto,
  SetMaintenanceModeDto,
} from '../dto/system-settings.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../../auth/interfaces/current-user.interface';
import {
  GetAuditMeta,
  AuditMeta,
} from '../../audit/decorators/audit-meta.decorator';

@Controller('system-settings')
@UseGuards(JwtAuthGuard, AdminGuard, RolesGuard)
@Roles(RoleEnum.SUPER_ADMIN)
export class SystemSettingsController {
  constructor(private readonly service: SystemSettingsService) {}

  @Get()
  async getSettings() {
    return this.service.getAllSettings();
  }

  @Put()
  async updateSetting(
    @Body() dto: UpdateSystemSettingDto,
    @CurrentUser() user: CurrentUserType,
    @GetAuditMeta() auditMeta: AuditMeta,
  ) {
    return this.service.updateSetting(
      dto.key,
      dto.value,
      dto.description,
      user.id,
      auditMeta,
    );
  }

  @Get('feature-flags')
  async getFeatureFlags() {
    return this.service.getAllFeatureFlags();
  }

  @Patch('feature-flags/:name')
  async toggleFeatureFlag(
    @Param('name') name: string,
    @Body() dto: ToggleFeatureFlagDto,
    @CurrentUser() user: CurrentUserType,
    @GetAuditMeta() auditMeta: AuditMeta,
  ) {
    return this.service.toggleFeatureFlag(
      name,
      dto.isEnabled,
      user.id,
      auditMeta,
    );
  }

  @Patch('maintenance')
  async setMaintenanceMode(
    @Body() dto: SetMaintenanceModeDto,
    @CurrentUser() user: CurrentUserType,
    @GetAuditMeta() auditMeta: AuditMeta,
  ) {
    const enabled = await this.service.setMaintenanceMode(
      dto.enabled,
      user.id,
      auditMeta,
    );
    return { maintenanceMode: enabled };
  }
}
