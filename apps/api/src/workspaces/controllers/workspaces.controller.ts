import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { WorkspacesService } from '../services/workspaces.service';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  TransferOwnershipDto,
} from '../dto/workspace.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../../auth/interfaces/current-user.interface';
import { WorkspaceRoleGuard } from '../guards/workspace-role.guard';
import { RequireWorkspaceRole } from '../decorators/workspace-role.decorator';
import { WorkspaceRole } from '../../workspace-members/entities/workspace-member.entity';

@Controller('workspaces')
@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  async createWorkspace(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreateWorkspaceDto,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    return this.workspacesService.createWorkspace(user.id, dto);
  }

  @Get()
  async getWorkspaces(@CurrentUser() user: CurrentUserType) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    return this.workspacesService.findAllForUser(user.id);
  }

  @Get(':id')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
    WorkspaceRole.VIEWER,
  )
  async getWorkspaceDetails(@Param('id') id: string) {
    return this.workspacesService.findById(id);
  }

  @Put(':id')
  @RequireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
  async updateWorkspace(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    return this.workspacesService.updateWorkspace(id, user.id, dto);
  }

  @Delete(':id')
  @RequireWorkspaceRole(WorkspaceRole.OWNER)
  async deleteWorkspace(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    await this.workspacesService.softDeleteWorkspace(id, user.id);
    return { success: true };
  }

  @Post('switch')
  async switchWorkspace(
    @CurrentUser() user: CurrentUserType,
    @Body('workspaceId') workspaceId: string,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    // Verify membership
    const workspaces = await this.workspacesService.findAllForUser(user.id);
    const hasMembership = workspaces.some((w) => w.id === workspaceId);
    if (!hasMembership) {
      throw new BadRequestException(
        'You do not belong to the target workspace',
      );
    }
    const workspace = await this.workspacesService.findById(workspaceId);
    return { success: true, workspace };
  }

  @Post(':id/transfer')
  @RequireWorkspaceRole(WorkspaceRole.OWNER)
  async transferOwnership(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: TransferOwnershipDto,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    return this.workspacesService.transferOwnership(id, user.id, dto);
  }

  @Get(':id/dashboard')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
    WorkspaceRole.VIEWER,
  )
  async getDashboard(@Param('id') id: string) {
    return this.workspacesService.getDashboard(id);
  }
}
