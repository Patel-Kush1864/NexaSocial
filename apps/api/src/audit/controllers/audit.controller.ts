import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuditService } from '../services/audit.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../admin/guards/admin.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { QueryAuditDto } from '../dto/audit.dto';
import { RequirePermission } from '../../auth/decorators/permissions.decorator';

@Controller('audit')
@UseGuards(JwtAuthGuard, AdminGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @RequirePermission('platform.audit_logs.view')
  async getAuditLogs(@Query() query: QueryAuditDto) {
    return this.service.getLogs(query);
  }

  @Get(':id')
  @RequirePermission('platform.audit_logs.view')
  async getAuditLogById(@Param('id') id: string) {
    const log = await this.service.getLogById(id);
    if (!log) {
      throw new UnauthorizedException('Audit log not found');
    }
    return log;
  }
}
