import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RoleEnum } from '../../auth/constants/roles.constants';
import { AdminFeatureFlagsService } from '../services/admin-feature-flags.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { ToggleFeatureFlagDto } from '../dto/feature-flag.dto';
import {
  GetAuditMeta,
  AuditMeta,
} from '../../audit/decorators/audit-meta.decorator';

@ApiTags('Admin Feature Flags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard, RolesGuard)
@Roles(RoleEnum.SUPER_ADMIN)
@Controller('admin/feature-flags')
export class AdminFeatureFlagsController {
  constructor(private readonly featureFlagsService: AdminFeatureFlagsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all feature flags (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'List of feature flags returned' })
  async getFeatureFlags() {
    return this.featureFlagsService.getFeatureFlags();
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get feature flag statistics' })
  async getStatistics() {
    return this.featureFlagsService.getStatistics();
  }

  @Patch(':key')
  @ApiOperation({ summary: 'Toggle feature flag' })
  async toggleFeatureFlag(
    @Param('key') key: string,
    @Body() dto: ToggleFeatureFlagDto,
    @CurrentUser() user: User,
    @GetAuditMeta() auditMeta: AuditMeta,
  ) {
    return this.featureFlagsService.toggleFeatureFlag(
      key,
      dto.enabled,
      user,
      auditMeta,
    );
  }
}
