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
    @Query('workspaceId') workspaceId: string,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    return this.service.getSummary(workspaceId, user.id);
  }

  @Get('statistics')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
    WorkspaceRole.VIEWER,
  )
  async getStatistics(@Query('workspaceId') workspaceId: string) {
    return this.service.getStatistics(workspaceId);
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
    @Query('workspaceId') workspaceId: string,
    @Query('widget') widget?: string,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    return this.service.getWidgets(workspaceId, user.id, widget);
  }
}
