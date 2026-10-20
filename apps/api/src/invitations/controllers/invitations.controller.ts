import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { InvitationsService } from '../services/invitations.service';
import {
  CreateInvitationDto,
  AcceptInvitationDto,
  RejectInvitationDto,
} from '../dto/invitations.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../../auth/interfaces/current-user.interface';
import { WorkspaceRoleGuard } from '../../workspaces/guards/workspace-role.guard';
import { RequireWorkspaceRole } from '../../workspaces/decorators/workspace-role.decorator';
import { WorkspaceRole } from '../../workspace-members/entities/workspace-member.entity';
import { SubscriptionGuard } from '../../subscriptions/guards/subscription.guard';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post(':id/invite')
  @UseGuards(WorkspaceRoleGuard, SubscriptionGuard)
  @RequireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
  async invite(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: CreateInvitationDto,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    return this.invitationsService.invite(id, user.id, dto);
  }

  @Post('invitations/accept')
  async accept(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: AcceptInvitationDto,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    return this.invitationsService.accept(dto, user.id);
  }

  @Post('invitations/reject')
  async reject(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: RejectInvitationDto,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    return this.invitationsService.reject(dto, user.id);
  }

  @Get(':id/invitations')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
  async getPendingInvitations(@Param('id') id: string) {
    return this.invitationsService.getPendingInvitations(id);
  }

  @Post(':id/invitations/:invitationId/resend')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
  async resendInvitation(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Param('invitationId') invitationId: string,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    return this.invitationsService.resendInvitation(id, invitationId, user.id);
  }

  @Post(':id/invitations/:invitationId/cancel')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
  async cancelInvitation(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Param('invitationId') invitationId: string,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    await this.invitationsService.cancelInvitation(id, invitationId, user.id);
    return { success: true };
  }
}
