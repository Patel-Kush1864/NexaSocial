import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from '../../users/entities/user.entity';

import { Request } from 'express';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email', passReqToCallback: true });
  }

  async validate(req: Request, email: string, password: string): Promise<User> {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const requestId = req['id'] as string;
    const user = await this.authService.validateUser(email, password, {
      ipAddress,
      userAgent,
      requestId,
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return user;
  }
}
