/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
import { MailService } from '../mail/mail.service';
import { WorkspacesService } from '../workspaces/services/workspaces.service';
import { InvitationsService } from '../invitations/services/invitations.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
    private readonly logger: LoggerServiceWrapper,
    private readonly eventEmitter: EventEmitter2,
    private readonly mailService: MailService,
    private readonly workspacesService: WorkspacesService,
    private readonly invitationsService: InvitationsService,
  ) {}

  async validateUser(
    email: string,
    password: string,
    clientInfo?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<User | null> {
    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      this.logger.warn(
        `Login failed: No account registered with email "${normalizedEmail}"`,
        'AuthService',
        'security',
      );
      this.eventEmitter.emit('security.login.failed', {
        email: normalizedEmail,
        reason: 'USER_NOT_FOUND',
        ...clientInfo,
      });
      return null;
    }

    if (!user.password) {
      this.logger.warn(
        `Login failed: Account "${normalizedEmail}" is an OAuth/Social account with no password`,
        'AuthService',
        'security',
      );
      this.eventEmitter.emit('security.login.failed', {
        email: normalizedEmail,
        reason: 'OAUTH_ACCOUNT',
        ...clientInfo,
      });
      return null;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      this.logger.warn(
        `Login failed: Password mismatch for email "${normalizedEmail}"`,
        'AuthService',
        'security',
      );
      this.eventEmitter.emit('security.login.failed', {
        email: normalizedEmail,
        reason: 'INVALID_CREDENTIALS',
        ...clientInfo,
      });
      return null;
    }

    if (user.status !== 'ACTIVE' || !user.isActive) {
      this.logger.warn(
        `Login failed: Account "${normalizedEmail}" is inactive or suspended (status: ${user.status})`,
        'AuthService',
        'security',
      );
      this.eventEmitter.emit('security.login.failed', {
        email: normalizedEmail,
        reason: 'INACTIVE_ACCOUNT',
        ...clientInfo,
      });
      return null;
    }

    return user;
  }

  async register(
    registerDto: RegisterDto,
  ): Promise<User & { isInvited?: boolean; workspaceId?: string | null }> {
    try {
      console.log(
        `[AuthService.register]: Starting registration process for email: "${registerDto.email}"`,
      );
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const normalizedEmail = registerDto.email.trim().toLowerCase();

      // Case A: Registration through team invitation
      if (registerDto.invitationToken) {
        console.log(
          `[AuthService.register]: Validating invitation token for: "${normalizedEmail}"`,
        );
        const inviteInfo = await this.invitationsService.validateToken(
          registerDto.invitationToken,
        );

        if (normalizedEmail !== inviteInfo.email.trim().toLowerCase()) {
          throw new BadRequestException(
            'Please use the email address to which this invitation was sent.',
          );
        }

        // Create user with invited role (MANAGER, CREATOR, or VIEWER) — never WORKSPACE_OWNER or ADMIN
        const invitedRole = inviteInfo.role || 'CREATOR';
        const user = await this.usersService.create(
          {
            email: normalizedEmail,
            password: registerDto.password,
            firstName: registerDto.firstName,
            lastName: registerDto.lastName,
            phoneNumber: registerDto.phoneNumber,
            verificationToken,
            isEmailVerified: true,
          },
          invitedRole,
        );

        // Do not create a separate workspace for invited members.
        // Immediately accept membership into the inviter's workspace
        await this.invitationsService.accept(
          { token: registerDto.invitationToken },
          user.id,
        );

        console.log(
          `[AuthService.register]: Invited user registered and joined Workspace ${inviteInfo.workspaceId} with role ${invitedRole}`,
        );

        const userName =
          `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

        await this.mailService.sendWelcomeEmail({
          id: user.id,
          name: userName,
          email: user.email,
        });

        await this.mailService.sendEmailVerification({
          id: user.id,
          name: userName,
          email: user.email,
          token: verificationToken,
        });

        this.eventEmitter.emit('user.registered', {
          userId: user.id,
          email: user.email,
          name: userName,
          isInvited: true,
          workspaceId: inviteInfo.workspaceId,
        });

        return Object.assign(user, {
          isInvited: true,
          workspaceId: inviteInfo.workspaceId,
        });
      }

      // Case B: Public Sign Up (No Invitation) — Workspace Owner workflow
      const user = await this.usersService.create(
        {
          email: normalizedEmail,
          password: registerDto.password,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          phoneNumber: registerDto.phoneNumber,
          verificationToken,
          isEmailVerified: true,
        },
        'WORKSPACE_OWNER',
      );

      console.log(
        `[AuthService.register]: Owner successfully registered with ID: "${user.id}". Workspace creation deferred to user manual creation.`,
      );

      const userName =
        `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

      // 1. Send Welcome Email
      await this.mailService.sendWelcomeEmail({
        id: user.id,
        name: userName,
        email: user.email,
      });

      // 2. Send Email Verification
      await this.mailService.sendEmailVerification({
        id: user.id,
        name: userName,
        email: user.email,
        token: verificationToken,
      });

      this.eventEmitter.emit('user.registered', {
        userId: user.id,
        email: user.email,
        name: userName,
        isInvited: false,
        workspaceId: null,
      });

      return Object.assign(user, {
        isInvited: false,
        workspaceId: null,
      });
    } catch (error: any) {
      console.error(
        `[AuthService.register ERROR] Exception during registration for ${registerDto.email}:`,
        error,
      );
      throw error;
    }
  }

  async login(
    user: User,
    clientInfo: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<TokenResponse> {
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email is not verified');
    }

    const sessionId = crypto.randomUUID();

    const userRole = user.role ? user.role.name : 'CREATOR';

    const permissions =
      user.role && user.role.permissions
        ? user.role.permissions.map((p) => p.key)
        : [];

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: userRole,
      permissions,
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

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

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

    this.eventEmitter.emit('security.login.success', {
      user,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      requestId: clientInfo.requestId,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60,
      user: {
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.email,
      },
      role: userRole,
      scope: ['SUPER_ADMIN', 'ADMIN'].includes(userRole)
        ? 'PLATFORM'
        : 'WORKSPACE',
      permissions,
    };
  }

  async logout(sessionId: string, user?: any, auditMeta?: any): Promise<void> {
    await this.sessionRepository.delete({ id: sessionId });

    if (user) {
      this.eventEmitter.emit('security.logout', { user, sessionId, auditMeta });
    }

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

  async validateUserFromSession(
    sessionId: string,
    userId: string,
  ): Promise<{ user: User; permissions: string[] } | null> {
    const isSessionValid = await this.validateSession(sessionId);
    if (!isSessionValid) {
      return null;
    }

    const user = await this.usersService.findById(userId);
    if (!user || user.status !== 'ACTIVE' || !user.isActive) {
      return null;
    }

    const permissions =
      user.role && user.role.permissions
        ? user.role.permissions.map((p) => p.key)
        : [];

    return { user, permissions };
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
        relations: { user: { role: { permissions: true } } },
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
      const userRole = user.role ? user.role.name : 'CREATOR';

      const permissions =
        user.role && user.role.permissions
          ? user.role.permissions.map((p) => p.key)
          : [];

      const tokenPayload: JwtPayload = {
        id: user.id,
        email: user.email,
        role: userRole,
        permissions,
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
        user: {
          id: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email,
        },
        role: userRole,
        scope: ['SUPER_ADMIN', 'ADMIN'].includes(userRole)
          ? 'PLATFORM'
          : 'WORKSPACE',
        permissions,
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

    const userName =
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

    await this.mailService.sendPasswordReset({
      id: user.id,
      name: userName,
      email: user.email,
      token: resetToken,
    });

    this.logger.log(
      `Password reset email sent to ${user.email}.`,
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

    const userName =
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

    await this.mailService.sendPasswordChangedNotification({
      id: user.id,
      name: userName,
      email: user.email,
    });

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

  async getProfile(userId: string, sessionId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const userRole = user.role ? user.role.name : 'CREATOR';
    const permissions =
      user.role && user.role.permissions
        ? user.role.permissions.map((p) => p.key)
        : [];

    return {
      user: {
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.email,
      },
      role: userRole,
      scope: ['SUPER_ADMIN', 'ADMIN'].includes(userRole)
        ? 'PLATFORM'
        : 'WORKSPACE',
      permissions,
      sessionId,
    };
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
