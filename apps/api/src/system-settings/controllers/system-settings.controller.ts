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
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RoleEnum } from '../../auth/constants/roles.constants';
import {
  UpdateSystemSettingDto,
  ToggleFeatureFlagDto,
  SetMaintenanceModeDto,
} from '../dto/system-settings.dto';

@Controller('system-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN)
export class SystemSettingsController {
  constructor(private readonly service: SystemSettingsService) {}

  @Get()
  async getSettings() {
    return this.service.getAllSettings();
  }

  @Put()
  async updateSetting(@Body() dto: UpdateSystemSettingDto) {
    return this.service.updateSetting(dto.key, dto.value, dto.description);
  }

  @Get('feature-flags')
  async getFeatureFlags() {
    return this.service.getAllFeatureFlags();
  }

  @Patch('feature-flags/:name')
  async toggleFeatureFlag(
    @Param('name') name: string,
    @Body() dto: ToggleFeatureFlagDto,
  ) {
    return this.service.toggleFeatureFlag(name, dto.isEnabled);
  }

  @Patch('maintenance')
  async setMaintenanceMode(@Body() dto: SetMaintenanceModeDto) {
    const enabled = await this.service.setMaintenanceMode(dto.enabled);
    return { maintenanceMode: enabled };
  }
}
