/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Query,
  UseGuards,
  Header,
  Res,
  Req,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from '../services/reports.service';
import { AuditService } from '../../audit/services/audit.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../admin/guards/admin.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { QueryReportsDto, ReportFormat } from '../dto/reports-query.dto';
import { RequirePermission } from '../../auth/decorators/permissions.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, AdminGuard, PermissionsGuard)
@RequirePermission('platform.reports.view')
export class ReportsController {
  constructor(
    private readonly service: ReportsService,
    private readonly auditService: AuditService,
  ) {}

  @Get('users')
  async getUsersReport(@Query() query: QueryReportsDto) {
    query.reportType = 'USERS';
    return this.service.generateReport(query);
  }

  @Get('workspaces')
  async getWorkspacesReport(@Query() query: QueryReportsDto) {
    query.reportType = 'WORKSPACES';
    return this.service.generateReport(query);
  }

  @Get('subscriptions')
  async getSubscriptionsReport(@Query() query: QueryReportsDto) {
    query.reportType = 'SUBSCRIPTIONS';
    return this.service.generateReport(query);
  }

  @Get('revenue')
  async getRevenueReport(@Query() query: QueryReportsDto) {
    query.reportType = 'REVENUE';
    return this.service.generateReport(query);
  }

  @Get('payments')
  async getPaymentsReport(@Query() query: QueryReportsDto) {
    query.reportType = 'PAYMENTS';
    return this.service.generateReport(query);
  }

  @Get('live-streams')
  async getLiveStreamsReport(@Query() query: QueryReportsDto) {
    query.reportType = 'LIVE_STREAMS';
    return this.service.generateReport(query);
  }

  @Get('social-platforms')
  async getSocialPlatformsReport(@Query() query: QueryReportsDto) {
    query.reportType = 'SOCIAL_PLATFORMS';
    return this.service.generateReport(query);
  }

  @Get('export/:type')
  @RequirePermission('platform.reports.export')
  @Header('Content-Type', 'text/csv')
  async exportReport(
    @Req() req: any,
    @Res() res: Response,
    @Query() query: QueryReportsDto,
  ) {
    const type = req.params.type.toUpperCase().replace('-', '_');
    query.reportType = type;
    query.format = ReportFormat.CSV;

    // Removing pagination limits for full export
    query.limit = 100000;
    query.page = 1;

    const csvData = (await this.service.generateReport(query)) as string;

    // Log audit event
    await this.auditService.logAction({
      adminUserId: req.user.id,
      action: 'REPORT_EXPORTED',
      module: 'Reports',
      targetType: 'REPORT',
      targetName: type,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { format: 'CSV' },
    });

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="report_${type.toLowerCase()}_export.csv"`,
    );
    res.send(csvData);
  }
}
