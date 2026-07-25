import {
  Controller,
  Get,
  Delete,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { WorkspaceMembersService } from '../services/workspace-members.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../../auth/interfaces/current-user.interface';
import { WorkspaceRoleGuard } from '../../workspaces/guards/workspace-role.guard';
import { RequireWorkspaceRole } from '../../workspaces/decorators/workspace-role.decorator';
import { WorkspaceRole } from '../entities/workspace-member.entity';

@Controller('workspaces/:id')
@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
export class WorkspaceMembersController {
  constructor(private readonly membersService: WorkspaceMembersService) {}

  @Get('members')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
    WorkspaceRole.VIEWER,
  )
  async getMembers(@Param('id') id: string) {
    return this.membersService.findMembers(id);
  }

  @Delete('members/:memberId')
  @RequireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
  async removeMember(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    await this.membersService.removeMember(id, memberId, user.id);
    return { success: true };
  }

  @Patch('members/:memberId')
  @RequireWorkspaceRole(WorkspaceRole.OWNER)
  async updateRole(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body('role') role: WorkspaceRole,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    return this.membersService.updateRole(id, memberId, role, user.id);
  }

  @Post('leave')
  async leaveWorkspace(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    await this.membersService.leaveWorkspace(id, user.id);
    return { success: true };
  }
}
