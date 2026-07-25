import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from '../services/audit.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RoleEnum } from '../../auth/constants/roles.constants';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN)
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  async getAuditLogs(
    @Query('adminUserId') adminUserId?: string,
    @Query('module') moduleName?: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;
    return this.service.getLogs(adminUserId, moduleName, limit, offset);
  }
}
