/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../../auth/auth.service';
import { LoginDto } from '../../auth/dto/login.dto';
import { LocalAuthGuard } from '../../auth/guards/local-auth.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../../auth/interfaces/current-user.interface';
import { Public } from '../../auth/decorators/public.decorator';
import { User } from '../../users/entities/user.entity';
import { TokenResponse } from '../../auth/interfaces/token-response.interface';
import { LoggerServiceWrapper } from '../../logger/logger.service';
import { RoleEnum } from '../../auth/constants/roles.constants';
import {
  GetAuditMeta,
  AuditMeta,
} from '../../audit/decorators/audit-meta.decorator';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: LoggerServiceWrapper,
  ) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(
    @Req() req: Request & { user: User },
    @Body() loginDto: LoginDto,
  ): Promise<TokenResponse> {
    this.logger.log(
      `Admin login attempt initiated for: ${loginDto.email}`,
      'AdminAuthController',
      'security',
    );

    // Verify admin role
    const hasAdminRole =
      req.user.role &&
      (req.user.role.name === RoleEnum.ADMIN ||
        req.user.role.name === RoleEnum.SUPER_ADMIN);

    if (!hasAdminRole) {
      this.logger.warn(
        `Failed admin login: User ${loginDto.email} lacks admin privileges.`,
        'AdminAuthController',
        'security',
      );
      throw new ForbiddenException('Admin access required');
    }

    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'] || '';

    this.logger.log(
      `Admin login successful for: ${loginDto.email}`,
      'AdminAuthController',
      'security',
    );

    return this.authService.login(req.user, { ipAddress, userAgent });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: CurrentUserType,
    @GetAuditMeta() auditMeta: AuditMeta,
  ): Promise<{ message: string }> {
    await this.authService.logout(user.sessionId, user, auditMeta);
    this.logger.log(
      `Admin logout for session: ${user.sessionId}`,
      'AdminAuthController',
      'security',
    );
    return { message: 'Successfully logged out' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getMe(@CurrentUser() user: CurrentUserType) {
    return user;
  }
}
