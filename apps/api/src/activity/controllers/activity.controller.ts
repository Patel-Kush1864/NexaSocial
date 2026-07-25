import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ActivityService } from '../services/activity.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../../auth/interfaces/current-user.interface';
import { WorkspaceRoleGuard } from '../../workspaces/guards/workspace-role.guard';
import { RequireWorkspaceRole } from '../../workspaces/decorators/workspace-role.decorator';
import { WorkspaceRole } from '../../workspace-members/entities/workspace-member.entity';

@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly service: ActivityService) {}

  @Get()
  async getRecentActivity(
    @CurrentUser() user: CurrentUserType,
    @Query('workspaceId') workspaceId?: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    return this.service.getRecentActivity(user.id, workspaceId, limit, offset);
  }

  @Get('user')
  async getUserActivity(
    @CurrentUser() user: CurrentUserType,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    return this.service.getUserActivity(user.id, limit, offset);
  }

  @Get('workspace/:id')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
    WorkspaceRole.VIEWER,
  )
  async getWorkspaceActivity(
    @Param('id') workspaceId: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    return this.service.getWorkspaceActivity(workspaceId, limit, offset);
  }
}
