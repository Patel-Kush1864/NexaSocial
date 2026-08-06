import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { FacebookService } from '../services/facebook.service';

export interface FacebookAuthPayload {
  accessToken: string;
  expiresIn?: number;
  profile: unknown;
}

export interface CustomStrategyContext {
  fail: (challenge: string, status: number) => void;
  success: (user: unknown) => void;
}

export class CustomFacebookOAuthStrategy {
  name = 'facebook';

  authenticate(this: CustomStrategyContext, req: Request): void {
    const query = req.query as Record<string, string | undefined>;
    const code = query?.code;
    if (!code) {
      this.fail('Missing authorization code', 400);
      return;
    }
    this.success({ code });
  }
}

@Injectable()
export class FacebookStrategy extends PassportStrategy(
  CustomFacebookOAuthStrategy as unknown as new (
    ...args: unknown[]
  ) => CustomFacebookOAuthStrategy,
  'facebook',
) {
  constructor(private readonly facebookService: FacebookService) {
    super();
  }

  async validate(payload: { code: string }): Promise<FacebookAuthPayload> {
    if (!payload?.code) {
      throw new UnauthorizedException('Invalid Facebook authorization code');
    }
    const tokenResult = await this.facebookService.exchangeCodeForToken(
      payload.code,
    );
    const profile = await this.facebookService.getFacebookUser(
      tokenResult.accessToken,
    );
    return {
      accessToken: tokenResult.accessToken,
      expiresIn: tokenResult.expiresIn,
      profile,
    };
  }
}
