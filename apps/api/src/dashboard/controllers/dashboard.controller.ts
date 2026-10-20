import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../../auth/interfaces/current-user.interface';
import { WorkspaceRoleGuard } from '../../workspaces/guards/workspace-role.guard';
import { RequireWorkspaceRole } from '../../workspaces/decorators/workspace-role.decorator';
import { WorkspaceRole } from '../../workspace-members/entities/workspace-member.entity';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
    WorkspaceRole.VIEWER,
  )
  async getSummary(
    @CurrentUser() user: CurrentUserType,
    @Query('workspaceId') workspaceId?: string,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    const isPlatformScope =
      user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
    return this.service.getSummary(user.id, isPlatformScope, workspaceId);
  }

  @Get('statistics')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
    WorkspaceRole.VIEWER,
  )
  async getStatistics(
    @CurrentUser() user: CurrentUserType,
    @Query('workspaceId') workspaceId?: string,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    const isPlatformScope =
      user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
    return this.service.getStatistics(isPlatformScope, workspaceId);
  }

  @Get('widgets')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
    WorkspaceRole.VIEWER,
  )
  async getWidgets(
    @CurrentUser() user: CurrentUserType,
    @Query('workspaceId') workspaceId?: string,
    @Query('widget') widget?: string,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    const isPlatformScope =
      user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
    return this.service.getWidgets(
      user.id,
      isPlatformScope,
      workspaceId,
      widget,
    );
  }
}
