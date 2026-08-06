import { Controller, Get, Req, Res, UseGuards, Query } from '@nestjs/common';
import type { Request, Response } from 'express';
import { GoogleAuthGuard } from './google.guard';
import { GoogleService } from './google.service';
import { GoogleUserProfile } from './google.strategy';

@Controller('auth/google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Get()
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Initiates Passport Google OAuth redirect
  }

  @Get('callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @Req() req: Request & { user?: GoogleUserProfile },
    @Res() res: Response,
    @Query('workspaceId') queryWorkspaceId?: string,
    @Query('state') stateStr?: string,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const profile = req.user;

    if (!profile) {
      return res.redirect(
        `${frontendUrl}/social?error=${encodeURIComponent('Google authentication failed')}`,
      );
    }

    let workspaceId = queryWorkspaceId;
    if (!workspaceId && stateStr) {
      try {
        const decoded = JSON.parse(
          Buffer.from(stateStr, 'base64').toString('utf8'),
        ) as { workspaceId?: string };
        if (decoded.workspaceId) {
          workspaceId = decoded.workspaceId;
        }
      } catch {
        // ignore state parse errors
      }
    }

    try {
      await this.googleService.handleGoogleCallback(profile, workspaceId);
      return res.redirect(`${frontendUrl}/social?connected=youtube`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.redirect(
        `${frontendUrl}/social?error=${encodeURIComponent(msg || 'Google OAuth callback failed')}`,
      );
    }
  }
}
