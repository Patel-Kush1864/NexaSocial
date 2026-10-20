import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SecurityService } from '../services/security.service';
import { QuerySecurityDto } from '../dto/security-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/decorators/permissions.decorator';

@Controller('security')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('platform.security.view')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get('summary')
  async getSummary() {
    return this.securityService.getSummary();
  }

  @Get('admin-logins')
  async getAdminLogins(@Query() query: QuerySecurityDto) {
    return this.securityService.getAdminLogins(query);
  }

  @Get('failed-logins')
  async getFailedLogins(@Query() query: QuerySecurityDto) {
    return this.securityService.getFailedLogins(query);
  }

  @Get('active-sessions')
  async getActiveSessions(@Query() query: QuerySecurityDto) {
    return this.securityService.getActiveSessions(query);
  }

  @Get('suspicious-activity')
  async getSuspiciousActivity(@Query() query: QuerySecurityDto) {
    return this.securityService.getSuspiciousActivity(query);
  }

  @Get('privileged-actions')
  async getPrivilegedActions(@Query() query: QuerySecurityDto) {
    return this.securityService.getPrivilegedActions(query);
  }

  @Get('events')
  async getEvents(@Query() query: QuerySecurityDto) {
    return this.securityService.getSecurityEvents(query);
  }
}
