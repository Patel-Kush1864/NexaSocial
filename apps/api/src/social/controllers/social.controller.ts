import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { SocialService } from '../services/social.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../../auth/interfaces/current-user.interface';
import { WorkspaceRoleGuard } from '../../workspaces/guards/workspace-role.guard';
import { RequireWorkspaceRole } from '../../workspaces/decorators/workspace-role.decorator';
import { WorkspaceRole } from '../../workspace-members/entities/workspace-member.entity';

@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('platforms')
  @UseGuards(JwtAuthGuard)
  async getPlatforms() {
    return this.socialService.getPlatforms();
  }

  @Post('connect/:platform')
  @UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
  async connect(
    @CurrentUser() user: CurrentUserType,
    @Param('platform') platform: string,
    @Query('workspaceId') workspaceId: string, // Guard checks x-workspace-id header or param
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    const result = await this.socialService.connect(
      platform,
      workspaceId,
      user.id,
    );
    return { url: result.url, authUrl: result.url };
  }

  // OAuth Redirect Callback (Public)
  @Get('callback/:platform')
  async callback(
    @Param('platform') platform: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (!code || !state) {
      return res.redirect(
        `${frontendUrl}/social?error=${encodeURIComponent(
          'Missing OAuth code or state parameter',
        )}`,
      );
    }
    try {
      await this.socialService.handleCallback(platform, code, state);
      return res.redirect(
        `${frontendUrl}/social?connected=${platform.toLowerCase()}`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.redirect(
        `${frontendUrl}/social?error=${encodeURIComponent(
          msg || 'OAuth connection failed',
        )}`,
      );
    }
  }

  @Get('accounts')
  @UseGuards(JwtAuthGuard)
  async getConnectedAccounts(
    @CurrentUser() user: CurrentUserType,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.socialService.getConnectedAccounts(workspaceId, user?.id);
  }

  @Get('accounts/:accountId')
  @UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
    WorkspaceRole.VIEWER,
  )
  async getAccountDetails(
    @Param('accountId') accountId: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.socialService.getAccountDetails(accountId, workspaceId);
  }

  @Post('accounts/:accountId/refresh')
  @UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
  async forceRefresh(
    @CurrentUser() user: CurrentUserType,
    @Param('accountId') accountId: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    await this.socialService.forceRefresh(accountId, workspaceId, user.id);
    return { success: true };
  }

  @Delete('accounts/:accountId')
  @UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
  async disconnect(
    @CurrentUser() user: CurrentUserType,
    @Param('accountId') accountId: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    await this.socialService.disconnect(accountId, workspaceId, user.id);
    return { success: true };
  }

  @Post('accounts/:accountId/sync')
  @UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole(
    WorkspaceRole.OWNER,
    WorkspaceRole.MANAGER,
    WorkspaceRole.CREATOR,
  )
  async syncAccount(
    @CurrentUser() user: CurrentUserType,
    @Param('accountId') accountId: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    return this.socialService.syncAccount(accountId, workspaceId, user.id);
  }
}
