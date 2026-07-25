import { Controller, Get, Query, UseGuards, Header } from '@nestjs/common';
import { ReportsService } from '../services/reports.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RoleEnum } from '../../auth/constants/roles.constants';
import { QueryReportsDto, ReportFormat } from '../dto/reports-query.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get()
  async getReport(@Query() query: QueryReportsDto) {
    return this.service.generateReport(query);
  }

  @Get('export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="report_export.csv"')
  async exportReport(@Query() query: QueryReportsDto) {
    query.format = ReportFormat.CSV;
    return this.service.generateReport(query);
  }
}
