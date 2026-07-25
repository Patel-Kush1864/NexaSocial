import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { LiveStreamsService } from '../services/livestreams.service'; // Actually, from services
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../../auth/interfaces/current-user.interface';
import { WorkspaceRoleGuard } from '../../workspaces/guards/workspace-role.guard';
import { RequireWorkspaceRole } from '../../workspaces/decorators/workspace-role.decorator';
import { WorkspaceRole } from '../../workspace-members/entities/workspace-member.entity';
import {
  CreateStreamDto,
  UpdateStreamDto,
  ScheduleStreamDto,
} from '../dto/livestream.dto';

@Controller('livestreams')
@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
export class LiveStreamsController {
  constructor(private readonly streamsService: LiveStreamsService) {}

  @Post()
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
  )
  async create(
    @CurrentUser() user: CurrentUserType,
    @Query('workspaceId') workspaceId: string,
    @Body() dto: CreateStreamDto,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    return this.streamsService.createStream(workspaceId, user.id, dto);
  }

  @Put(':id')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
  )
  async update(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Body() dto: UpdateStreamDto,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    return this.streamsService.updateStream(id, workspaceId, user.id, dto);
  }

  @Delete(':id')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
  )
  async delete(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    await this.streamsService.softDeleteStream(id, workspaceId, user.id);
    return { success: true };
  }

  @Post(':id/schedule')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
  )
  async schedule(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Body() dto: ScheduleStreamDto,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    return this.streamsService.scheduleStream(
      id,
      workspaceId,
      user.id,
      new Date(dto.scheduledAt),
    );
  }

  @Post(':id/start')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
  )
  async start(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    return this.streamsService.startStream(id, workspaceId, user.id);
  }

  @Post(':id/stop')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
  )
  async stop(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    return this.streamsService.stopStream(id, workspaceId, user.id);
  }

  @Get('history')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
    WorkspaceRole.VIEWER,
  )
  async getHistory(@Query('workspaceId') workspaceId: string) {
    return this.streamsService.getHistory(workspaceId);
  }

  @Get('dashboard')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
    WorkspaceRole.VIEWER,
  )
  async getDashboard(@Query('workspaceId') workspaceId: string) {
    return this.streamsService.getDashboardStats(workspaceId);
  }

  @Get(':id')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
    WorkspaceRole.VIEWER,
  )
  async getDetails(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.streamsService.getStreamDetails(id, workspaceId);
  }
}
