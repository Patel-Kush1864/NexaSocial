import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { FacebookProvider } from '../providers/facebook.provider';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../../auth/interfaces/current-user.interface';
import { FacebookAccountResponseDto } from '../dto/facebook-account-response.dto';

@Controller('social/facebook')
export class FacebookController {
  private readonly logger = new Logger(FacebookController.name);

  constructor(private readonly facebookProvider: FacebookProvider) {}

  /**
   * GET /api/social/facebook/connect
   * Generates Facebook OAuth URL for the authenticated user and returns it in JSON response.
   */
  @Get('connect')
  @UseGuards(JwtAuthGuard)
  connect(@CurrentUser() user: CurrentUserType): { url: string } {
    if (!user || !user.id) {
      throw new UnauthorizedException('User authentication required');
    }
    const authUrl = this.facebookProvider.connect(user.id);
    this.logger.log(
      `Initiated Facebook OAuth authorization for user ${user.id}`,
    );
    return { url: authUrl };
  }

  /**
   * GET /api/social/facebook/callback
   * Public callback endpoint from Facebook OAuth. Receives code, exchanges token, stores Facebook Pages, and redirects to frontend.
   */
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (error || !code) {
      this.logger.warn(
        `Facebook OAuth cancelled or failed: ${errorDescription || error}`,
      );
      res.redirect(
        `${frontendUrl}/social?error=${encodeURIComponent(
          errorDescription || error || 'OAuth authorization cancelled',
        )}`,
      );
      return;
    }

    try {
      let userId = '';
      if (state) {
        try {
          const decoded = JSON.parse(
            Buffer.from(state, 'base64').toString('utf8'),
          ) as { userId?: string };
          if (decoded.userId) {
            userId = decoded.userId;
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          this.logger.warn(`Failed to parse state: ${msg}`);
        }
      }

      if (!userId) {
        throw new UnauthorizedException(
          'Invalid state parameter: missing user context',
        );
      }

      await this.facebookProvider.handleCallback(code, userId, state);

      res.redirect(`${frontendUrl}/social?connected=facebook`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Facebook callback processing error: ${msg}`);
      res.redirect(
        `${frontendUrl}/social?error=${encodeURIComponent(
          msg || 'Facebook connection failed',
        )}`,
      );
    }
  }

  /**
   * GET /api/social/facebook/accounts
   * Returns all connected Facebook Pages/Accounts for the logged-in user without exposing raw tokens.
   */
  @Get('accounts')
  @UseGuards(JwtAuthGuard)
  async getAccounts(
    @CurrentUser() user: CurrentUserType,
  ): Promise<FacebookAccountResponseDto[]> {
    if (!user || !user.id) {
      throw new UnauthorizedException('User authentication required');
    }
    const accounts = await this.facebookProvider.getAccounts(user.id);
    return accounts.map((acc) => FacebookAccountResponseDto.fromEntity(acc));
  }

  /**
   * DELETE /api/social/facebook/:id
   * Disconnects a connected Facebook Page/Account by ID.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async disconnect(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
  ): Promise<void> {
    if (!user || !user.id) {
      throw new UnauthorizedException('User authentication required');
    }
    await this.facebookProvider.disconnect(id, user.id);
  }
}
