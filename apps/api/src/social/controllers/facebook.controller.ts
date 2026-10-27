import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { FacebookProvider } from '../providers/facebook.provider';
import { SocialAccount } from '../entities/social-account.entity';
import { Platform } from '../../database/entities/platform.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../../auth/interfaces/current-user.interface';
import { FacebookAccountResponseDto } from '../dto/facebook-account-response.dto';
import { decrypt } from '../utils/crypto.helper';
import { ConfigService } from '@nestjs/config';

export class CreateFacebookLiveDto {
  accountId?: string;
  pageId?: string;
  title?: string;
  description?: string;
}

@Controller('social/facebook')
export class FacebookController {
  private readonly logger = new Logger(FacebookController.name);

  constructor(
    private readonly facebookProvider: FacebookProvider,
    @InjectRepository(Platform)
    private readonly platformRepository: Repository<Platform>,
  ) {}

  /**
   * GET /api/social/facebook/connect
   * Generates Facebook OAuth URL for the authenticated user and returns it in JSON response.
   */
  @Get('connect')
  @UseGuards(JwtAuthGuard)
  async connect(
    @CurrentUser() user: CurrentUserType,
    @Query('redirect') redirect?: string,
    @Res({ passthrough: true }) res?: Response,
  ): Promise<{ url: string } | void> {
    if (!user || !user.id) {
      throw new UnauthorizedException('User authentication required');
    }

    const platformRecord = await this.platformRepository.findOne({
      where: { name: 'Facebook' },
    });
    if (platformRecord && !platformRecord.isActive) {
      throw new BadRequestException(
        'This social platform is currently unavailable.',
      );
    }

    const authUrl = this.facebookProvider.connect(user.id);
    this.logger.log(
      `Initiated Facebook OAuth authorization for user ${user.id}`,
    );
    if (redirect === 'true' && res) {
      res.redirect(authUrl);
      return;
    }
    return { url: authUrl };
  }

  /**
   * GET /api/social/facebook/callback
   * Public callback endpoint from Facebook OAuth. Receives code, exchanges token, stores Facebook Pages in MySQL, and redirects to frontend.
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
    @Query('workspaceId') workspaceId?: string,
  ): Promise<FacebookAccountResponseDto[]> {
    if (!user || !user.id) {
      throw new UnauthorizedException('User authentication required');
    }
    const accounts = await this.facebookProvider.getAccounts(user.id, workspaceId);
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

@Controller('auth/facebook')
export class AuthFacebookController {
  private readonly logger = new Logger(AuthFacebookController.name);

  constructor(private readonly facebookProvider: FacebookProvider) {}

  @Get('')
  @UseGuards(JwtAuthGuard)
  connect(
    @CurrentUser() user: CurrentUserType,
    @Query('redirect') redirect?: string,
    @Res({ passthrough: true }) res?: Response,
  ): { url: string } | void {
    if (!user || !user.id) {
      throw new UnauthorizedException('User authentication required');
    }
    const authUrl = this.facebookProvider.connect(user.id);
    this.logger.log(
      `Initiated Facebook OAuth authorization for user ${user.id}`,
    );
    if (redirect === 'true' && res) {
      res.redirect(authUrl);
      return;
    }
    return { url: authUrl };
  }

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
}

@Controller('social-accounts/facebook')
export class SocialAccountsFacebookController {
  constructor(private readonly facebookProvider: FacebookProvider) {}

  @Get('')
  @UseGuards(JwtAuthGuard)
  async getAccounts(
    @CurrentUser() user: CurrentUserType,
    @Query('workspaceId') workspaceId?: string,
  ): Promise<FacebookAccountResponseDto[]> {
    if (!user || !user.id) {
      throw new UnauthorizedException('User authentication required');
    }
    const accounts = await this.facebookProvider.getAccounts(user.id, workspaceId);
    return accounts.map((acc) => FacebookAccountResponseDto.fromEntity(acc));
  }

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

@Controller('facebook/live')
export class FacebookLiveController {
  private readonly logger = new Logger(FacebookLiveController.name);

  constructor(
    @InjectRepository(SocialAccount)
    private readonly socialAccountRepository: Repository<SocialAccount>,
    private readonly configService: ConfigService,
  ) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createLiveStream(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreateFacebookLiveDto,
  ) {
    if (!user || !user.id) {
      throw new UnauthorizedException('User authentication required');
    }

    let account: SocialAccount | null = null;

    if (dto.accountId) {
      account = await this.socialAccountRepository.findOne({
        where: { id: dto.accountId, userId: user.id },
      });
    } else if (dto.pageId) {
      account = await this.socialAccountRepository.findOne({
        where: {
          userId: user.id,
          provider: In(['facebook', 'FACEBOOK']),
          pageId: dto.pageId,
        },
      });
    } else {
      account = await this.socialAccountRepository.findOne({
        where: {
          userId: user.id,
          provider: In(['facebook', 'FACEBOOK']),
          connected: true,
        },
        order: { connectedAt: 'DESC' },
      });
    }

    if (!account) {
      throw new NotFoundException(
        'No connected Facebook account or Page found. Please connect Facebook first.',
      );
    }

    let rawToken = account.pageAccessToken || account.accessToken || '';
    if (rawToken.includes(':')) {
      try {
        rawToken = decrypt(rawToken);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to decrypt Facebook access token: ${msg}`);
        throw new BadRequestException(
          'Invalid or corrupt Facebook access token',
        );
      }
    }

    if (!rawToken || rawToken.startsWith('mock_')) {
      const mockStreamId = `mock_fb_live_${Math.random().toString(36).substring(7)}`;
      return {
        success: true,
        mock: true,
        platform: 'facebook',
        pageId: account.pageId || account.providerUserId,
        pageName: account.pageName || account.providerName,
        platformStreamId: mockStreamId,
        streamUrl: 'rtmps://live-api-s.facebook.com:443/rtmp/',
        streamKey: `FB-${mockStreamId}`,
        secureStreamUrl: `rtmps://live-api-s.facebook.com:443/rtmp/FB-${mockStreamId}`,
      };
    }

    const graphVersion =
      this.configService.get<string>('oauth.facebook.graphVersion') ||
      process.env.FACEBOOK_GRAPH_VERSION ||
      'v23.0';

    const targetPath = account.pageId ? account.pageId : 'me';
    const url = `https://graph.facebook.com/${graphVersion}/${targetPath}/live_videos`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: dto.title || 'NexaSocial Live Stream',
          description: dto.description || 'Broadcasting live via NexaSocial',
          status: 'UNPUBLISHED',
          access_token: rawToken,
        }),
      });

      const data = (await response.json()) as {
        id?: string;
        stream_url?: string;
        secure_stream_url?: string;
        error?: { message?: string };
      };

      if (!response.ok || !data.id) {
        throw new BadRequestException(
          data.error?.message || 'Failed to create Facebook Live Video stream',
        );
      }

      const secureUrl = data.secure_stream_url || data.stream_url || '';
      const parts = secureUrl.split('/rtmp/');
      const streamUrl = parts[0]
        ? `${parts[0]}/rtmp/`
        : 'rtmps://live-api-s.facebook.com:443/rtmp/';
      const streamKey = parts[1] || '';

      this.logger.log(
        `Successfully created Facebook Live video ID ${data.id} for Page ${account.pageName || account.pageId}`,
      );

      return {
        success: true,
        platform: 'facebook',
        pageId: account.pageId,
        pageName: account.pageName,
        platformStreamId: data.id,
        streamUrl,
        streamKey,
        secureStreamUrl: secureUrl,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Facebook Live video creation error: ${msg}`);
      throw new BadRequestException(
        `Facebook Live Video creation failed: ${msg}`,
      );
    }
  }
}
