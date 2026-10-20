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
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('token'),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUser> {
    const authData = await this.authService.validateUserFromSession(
      payload.sessionId,
      payload.id,
    );

    if (!authData) {
      throw new UnauthorizedException('Session revoked or user is inactive');
    }

    return {
      id: authData.user.id,
      email: authData.user.email,
      role: authData.user.role?.name || 'CREATOR',
      permissions: authData.permissions,
      sessionId: payload.sessionId,
    };
  }
}
