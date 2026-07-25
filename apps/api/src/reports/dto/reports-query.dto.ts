import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum ReportFormat {
  JSON = 'JSON',
  CSV = 'CSV',
  EXCEL = 'EXCEL',
  PDF = 'PDF',
}

export class QueryReportsDto {
  @IsString()
  @IsOptional()
  reportType?: string; // 'REVENUE', 'NEW_USERS', 'SUBSCRIPTIONS', 'STREAMS', 'PLATFORMS', 'WORKSPACES'

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsEnum(ReportFormat)
  @IsOptional()
  format?: ReportFormat;
}
