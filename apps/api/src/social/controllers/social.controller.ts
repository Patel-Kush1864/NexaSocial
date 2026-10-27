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
import { SubscriptionGuard } from '../../subscriptions/guards/subscription.guard';
import { SkipSubscriptionCheck } from '../../subscriptions/decorators/skip-subscription-check.decorator';

import { Public } from '../../auth/decorators/public.decorator';

@Controller('social')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
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

  @Public()
  @SkipSubscriptionCheck()
  @Get('preflight/:platform')
  getPreflight(@Param('platform') platform: string) {
    return this.socialService.getPreflightDiagnostics(platform);
  }

  // OAuth Redirect Callback (Public)
  @Public()
  @SkipSubscriptionCheck()
  @Get('callback/:platform')
  async callback(
    @Param('platform') platform: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Query('error_reason') errorReason: string,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    console.log(
      `[SocialController] OAuth redirect callback received for platform: ${platform} | Has Code: ${Boolean(code)} | Has State: ${Boolean(state)} | Has Error: ${Boolean(error)}`,
    );

    if (error) {
      const rawErrorMsg =
        errorDescription ||
        errorReason ||
        error ||
        'OAuth authorization cancelled or denied by user';
      // Sanitize any sensitive tokens/secrets
      const sanitizedError = rawErrorMsg
        .replace(/client_secret=[^&\s]+/gi, 'client_secret=***')
        .replace(/access_token=[^&\s]+/gi, 'access_token=***')
        .replace(/code=[^&\s]+/gi, 'code=***');

      console.warn(
        `[SocialController] OAuth provider returned error during callback: ${sanitizedError}`,
      );

      return res.redirect(
        `${frontendUrl}/social?error=${encodeURIComponent(sanitizedError)}`,
      );
    }

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
      const rawMsg = err instanceof Error ? err.message : String(err);
      const sanitizedMsg = (rawMsg || 'OAuth connection failed')
        .replace(/client_secret=[^&\s]+/gi, 'client_secret=***')
        .replace(/access_token=[^&\s]+/gi, 'access_token=***')
        .replace(/code=[^&\s]+/gi, 'code=***');

      console.error(
        `[SocialController] OAuth callback handling failed for ${platform}: ${sanitizedMsg}`,
      );

      return res.redirect(
        `${frontendUrl}/social?error=${encodeURIComponent(sanitizedMsg)}`,
      );
    }
  }

  @Get('accounts')
  async getConnectedAccounts(
    @CurrentUser() user: CurrentUserType,
    @Query('workspaceId') workspaceId?: string,
  ) {
    console.log(
      `[SocialController] GET /social/accounts requested by user: ${user?.id} (${user?.email}), role: ${user?.role}, workspaceId: ${workspaceId}`,
    );
    const accounts = await this.socialService.getConnectedAccounts(
      workspaceId,
      user?.id,
      user?.role,
    );
    console.log(`[SocialController] Returning ${accounts.length} connected accounts.`);
    return accounts;
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
