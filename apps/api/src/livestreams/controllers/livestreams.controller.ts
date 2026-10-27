import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Headers,
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
import { SubscriptionGuard } from '../../subscriptions/guards/subscription.guard';
import {
  CreateStreamDto,
  UpdateStreamDto,
  ScheduleStreamDto,
  FacebookSourceDto,
  FacebookMetadataDto,
  FacebookPublishDto,
  InstagramSourceDto,
  InstagramConfirmLiveDto,
} from '../dto/livestream.dto';
import { StreamStatus } from '../entities/livestream.entity';

@Controller('livestreams')
@UseGuards(JwtAuthGuard, WorkspaceRoleGuard, SubscriptionGuard)
export class LiveStreamsController {
  constructor(private readonly streamsService: LiveStreamsService) { }

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
    console.log(
      `\n\x1b[1;33m╔════════════════════════════════════════════════════════════════════════════════╗\n` +
      `║ [CONTROLLER ENTRY] POST /livestreams/${id}/start (GO LIVE)                  \n` +
      `╚════════════════════════════════════════════════════════════════════════════════╝\x1b[0m\n` +
      `  • Stream ID:    ${id}\n` +
      `  • Workspace ID: ${workspaceId}\n` +
      `  • User ID:      ${user.id}\n`,
    );
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
    console.log(
      `\n\x1b[1;31m╔════════════════════════════════════════════════════════════════════════════════╗\n` +
      `║ [CONTROLLER ENTRY] POST /livestreams/${id}/stop (STOP STREAM)               \n` +
      `╚════════════════════════════════════════════════════════════════════════════════╝\x1b[0m\n` +
      `  • Stream ID:    ${id}\n` +
      `  • Workspace ID: ${workspaceId}\n` +
      `  • User ID:      ${user.id}\n`,
    );
    return this.streamsService.stopStream(id, workspaceId, user.id);
  }

  @Get('history')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
    WorkspaceRole.VIEWER,
  )
  async getHistory(
    @Query('workspaceId') workspaceId: string,
    @Headers('x-workspace-id') headerWorkspaceId?: string,
    @Query('status') status?: StreamStatus,
  ) {
    const wsId = workspaceId || headerWorkspaceId || '';
    return this.streamsService.getHistory(wsId, status);
  }

  @Get('dashboard')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
    WorkspaceRole.VIEWER,
  )
  async getDashboard(
    @Query('workspaceId') workspaceId: string,
    @Headers('x-workspace-id') headerWorkspaceId?: string,
  ) {
    const wsId = workspaceId || headerWorkspaceId || '';
    return this.streamsService.getDashboardStats(wsId);
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

  @Post(':id/facebook/source')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
  )
  async verifyFacebookSource(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Body() dto: FacebookSourceDto,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    const maskedKey = dto?.streamKey
      ? dto.streamKey.length > 8
        ? `${dto.streamKey.slice(0, 4)}••••••••`
        : '••••••••'
      : '(not provided)';
    console.log(
      `\n\x1b[1;36m╔════════════════════════════════════════════════════════════════════════════════╗\n` +
      `║ [CONTROLLER ENTRY] POST /livestreams/${id}/facebook/source (STEP 1)         \n` +
      `╚════════════════════════════════════════════════════════════════════════════════╝\x1b[0m\n` +
      `  • Stream ID:        ${id}\n` +
      `  • Workspace ID:     ${workspaceId}\n` +
      `  • User ID:          ${user.id}\n` +
      `  • Platform ID:      ${dto?.platformId || 'ALL_FACEBOOK'}\n` +
      `  • Custom Stream URL: ${dto?.streamUrl || dto?.customStreamUrl || '(none)'}\n` +
      `  • Custom Stream Key: ${maskedKey}\n`,
    );
    return this.streamsService.verifyFacebookSource(id, workspaceId, dto);
  }

  @Post(':id/facebook/metadata')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
  )
  async syncFacebookMetadata(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Body() dto: FacebookMetadataDto,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    console.log(
      `\n\x1b[1;35m╔════════════════════════════════════════════════════════════════════════════════╗\n` +
      `║ [CONTROLLER ENTRY] POST /livestreams/${id}/facebook/metadata (STEP 2)       \n` +
      `╚════════════════════════════════════════════════════════════════════════════════╝\x1b[0m\n` +
      `  • Stream ID:    ${id}\n` +
      `  • Workspace ID: ${workspaceId}\n` +
      `  • User ID:      ${user.id}\n` +
      `  • Platform ID:  ${dto?.platformId || 'ALL_FACEBOOK'}\n` +
      `  • Title:        "${dto?.title || '(default stream title)'}"\n` +
      `  • Description:  "${(dto?.description || '').slice(0, 50)}${(dto?.description?.length || 0) > 50 ? '...' : ''}"\n`,
    );
    return this.streamsService.syncFacebookMetadata(id, workspaceId, dto);
  }

  @Post(':id/facebook/publish')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
  )
  async goLiveFacebook(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Body() dto: FacebookPublishDto,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    console.log(
      `\n\x1b[1;32m╔════════════════════════════════════════════════════════════════════════════════╗\n` +
      `║ [CONTROLLER ENTRY] POST /livestreams/${id}/facebook/publish (STEP 3)        \n` +
      `╚════════════════════════════════════════════════════════════════════════════════╝\x1b[0m\n` +
      `  • Stream ID:    ${id}\n` +
      `  • Workspace ID: ${workspaceId}\n` +
      `  • User ID:      ${user.id}\n` +
      `  • Platform ID:  ${dto?.platformId || 'ALL_FACEBOOK'}\n`,
    );
    return this.streamsService.goLiveFacebook(
      id,
      workspaceId,
      user.id,
      dto?.platformId,
    );
  }

  @Get(':id/facebook/status')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
    WorkspaceRole.VIEWER,
  )
  async getFacebookStatus(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Query('platformId') platformId?: string,
  ) {
    console.log(
      `\x1b[90m[CONTROLLER ENTRY] GET /livestreams/${id}/facebook/status (workspace: ${workspaceId}, platform: ${platformId || 'any'})\x1b[0m`,
    );
    return this.streamsService.getFacebookWorkflowStatus(
      id,
      workspaceId,
      platformId,
    );
  }

  @Post(':id/instagram/source')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
  )
  async configureInstagramSource(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Body() dto: InstagramSourceDto,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    return this.streamsService.configureInstagramSource(
      id,
      workspaceId,
      user.id,
      dto,
    );
  }

  @Post(':id/instagram/start')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
  )
  async startInstagramOutput(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Body() body?: { platformId?: string },
  ) {
    if (!user) throw new BadRequestException('User context missing');
    return this.streamsService.startInstagramOutput(
      id,
      workspaceId,
      user.id,
      body?.platformId,
    );
  }

  @Post(':id/instagram/stop')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
  )
  async stopInstagramOutput(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Body() body?: { platformId?: string },
  ) {
    if (!user) throw new BadRequestException('User context missing');
    return this.streamsService.stopInstagramOutput(
      id,
      workspaceId,
      user.id,
      body?.platformId,
    );
  }

  @Post(':id/instagram/confirm-live')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
  )
  async confirmInstagramLive(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Body() body?: InstagramConfirmLiveDto,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    return this.streamsService.confirmInstagramLive(
      id,
      workspaceId,
      user.id,
      body?.platformId,
      body?.manualConfirmed,
    );
  }

  @Get(':id/instagram/status')
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
    WorkspaceRole.VIEWER,
  )
  async getInstagramStatus(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Query('platformId') platformId?: string,
  ) {
    return this.streamsService.getInstagramWorkflowStatus(
      id,
      workspaceId,
      platformId,
    );
  }
}
