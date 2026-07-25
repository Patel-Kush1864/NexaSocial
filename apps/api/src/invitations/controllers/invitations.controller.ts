import {
  Controller,
  Post,
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

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post(':id/invite')
  @UseGuards(WorkspaceRoleGuard)
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
}
