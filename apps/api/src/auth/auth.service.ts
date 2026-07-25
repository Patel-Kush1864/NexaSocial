import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { UserSession } from '../users/entities/user-session.entity';
import { RegisterDto } from './dto/register.dto';
import { TokenResponse } from './interfaces/token-response.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { jwtConstants } from './constants/jwt.constants';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoggerServiceWrapper } from '../logger/logger.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
    private readonly logger: LoggerServiceWrapper,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        return user;
      }
    }
    return null;
  }

  async register(registerDto: RegisterDto): Promise<User> {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = await this.usersService.create(
      {
        email: registerDto.email,
        password: registerDto.password,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      },
      'CREATOR',
    );

    user.phoneNumber = registerDto.phoneNumber;
    user.verificationToken = verificationToken;
    await this.usersService.save(user);

    const verificationLink = `http://localhost:3000/auth/verify-email?token=${verificationToken}`;
    this.logger.log(
      `Verification email sent to ${user.email}. Link: ${verificationLink}`,
      'AuthService',
      'security',
    );

    return user;
  }

  async login(
    user: User,
    clientInfo: { ipAddress?: string; userAgent?: string },
  ): Promise<TokenResponse> {
    const sessionId = crypto.randomUUID();

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Email verification is required before login',
      );
    }

    const userRole =
      user.roles && user.roles.length > 0 ? user.roles[0].name : 'CREATOR';

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: userRole,
      sessionId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtConstants.secret,
      expiresIn: jwtConstants.expiresIn,
    });

    const refreshToken = this.jwtService.sign(
      { sessionId },
      {
        secret: jwtConstants.refreshSecret,
        expiresIn: jwtConstants.refreshExpiresIn,
      },
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    const browser = clientInfo.userAgent || 'unknown';
    const device = clientInfo.userAgent
      ? this.parseDevice(clientInfo.userAgent)
      : 'unknown';

    const session = this.sessionRepository.create({
      userId: user.id,
      refreshTokenHash,
      ipAddress: clientInfo.ipAddress,
      browser,
      device,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    session.id = sessionId;
    await this.sessionRepository.save(session);

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60,
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionRepository.delete({ id: sessionId });
    this.logger.log(
      `Session ${sessionId} successfully logged out.`,
      'AuthService',
      'security',
    );
  }

  async validateSession(sessionId: string): Promise<boolean> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });
    if (!session) {
      return false;
    }
    if (new Date() > session.expiresAt) {
      await this.sessionRepository.delete({ id: sessionId });
      return false;
    }
    return true;
  }

  async refresh(refreshToken: string): Promise<TokenResponse> {
    try {
      const payload = this.jwtService.verify<{ sessionId: string }>(
        refreshToken,
        {
          secret: jwtConstants.refreshSecret,
        },
      );

      const session = await this.sessionRepository.findOne({
        where: { id: payload.sessionId },
        relations: { user: { roles: true } },
      });

      if (!session) {
        throw new UnauthorizedException('Session not found or revoked');
      }

      if (new Date() > session.expiresAt) {
        await this.sessionRepository.delete({ id: session.id });
        throw new UnauthorizedException('Session expired');
      }

      const isMatch = await bcrypt.compare(
        refreshToken,
        session.refreshTokenHash,
      );
      if (!isMatch) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = session.user;
      const userRole =
        user.roles && user.roles.length > 0 ? user.roles[0].name : 'CREATOR';

      const tokenPayload: JwtPayload = {
        id: user.id,
        email: user.email,
        role: userRole,
        sessionId: session.id,
      };

      const newAccessToken = this.jwtService.sign(tokenPayload, {
        secret: jwtConstants.secret,
        expiresIn: jwtConstants.expiresIn,
      });

      const newRefreshToken = this.jwtService.sign(
        { sessionId: session.id },
        {
          secret: jwtConstants.refreshSecret,
          expiresIn: jwtConstants.refreshExpiresIn,
        },
      );

      session.refreshTokenHash = await bcrypt.hash(newRefreshToken, 12);
      await this.sessionRepository.save(session);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000);
    await this.usersService.save(user);

    const resetLink = `http://localhost:3000/auth/reset-password?token=${resetToken}`;
    this.logger.log(
      `Password reset email sent to ${user.email}. Link: ${resetLink}`,
      'AuthService',
      'security',
    );
  }

  async resetPassword(token: string, passwordDto: string): Promise<void> {
    const users = await this.sessionRepository.manager.find(User, {
      where: { passwordResetToken: token },
    });
    const user = users[0];

    if (
      !user ||
      !user.passwordResetExpires ||
      new Date() > user.passwordResetExpires
    ) {
      throw new BadRequestException('Reset token is invalid or has expired');
    }

    user.password = await bcrypt.hash(passwordDto, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await this.sessionRepository.delete({ userId: user.id });
    await this.usersService.save(user);

    this.logger.log(
      `Password reset successfully for user ${user.email}. Revoked all active sessions.`,
      'AuthService',
      'security',
    );
  }

  async verifyEmail(token: string): Promise<void> {
    const users = await this.sessionRepository.manager.find(User, {
      where: { verificationToken: token },
    });
    const user = users[0];

    if (!user) {
      throw new BadRequestException(
        'Verification token is invalid or has expired',
      );
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    await this.usersService.save(user);

    this.logger.log(
      `Email verified successfully for user ${user.email}.`,
      'AuthService',
      'security',
    );
  }

  private parseDevice(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (
      ua.includes('mobile') ||
      ua.includes('android') ||
      ua.includes('iphone')
    ) {
      return 'mobile';
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    }
    return 'desktop';
  }
}
