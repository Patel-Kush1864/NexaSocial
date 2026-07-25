import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { jwtConstants } from '../constants/jwt.constants';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { CurrentUser } from '../interfaces/current-user.interface';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUser> {
    const isSessionValid = await this.authService.validateSession(
      payload.sessionId,
    );
    if (!isSessionValid) {
      throw new UnauthorizedException('Session has been revoked');
    }

    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sessionId,
    };
  }
}
