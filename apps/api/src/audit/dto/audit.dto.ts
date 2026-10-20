import { IsString, IsOptional, IsUUID, IsObject, IsIn } from 'class-validator';

export class CreateAuditLogDto {
  @IsUUID()
  adminUserId: string;

  @IsString()
  action: string;

  @IsString()
  @IsOptional()
  module?: string;

  @IsString()
  @IsOptional()
  targetType?: string;

  @IsString()
  @IsOptional()
  targetId?: string;

  @IsString()
  @IsOptional()
  targetName?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsString()
  @IsOptional()
  requestId?: string;
}

export class QueryAuditDto {
  @IsUUID()
  @IsOptional()
  adminUserId?: string;

  @IsString()
  @IsOptional()
  action?: string;

  @IsString()
  @IsOptional()
  module?: string;

  @IsString()
  @IsOptional()
  dateFrom?: string;

  @IsString()
  @IsOptional()
  dateTo?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsIn(['ASC', 'DESC'])
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
