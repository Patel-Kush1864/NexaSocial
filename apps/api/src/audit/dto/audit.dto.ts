import { IsString, IsOptional, IsUUID, IsObject } from 'class-validator';

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
  targetId?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  ipAddress?: string;
}

export class QueryAuditDto {
  @IsUUID()
  @IsOptional()
  adminUserId?: string;

  @IsString()
  @IsOptional()
  module?: string;

  @IsOptional()
  limit?: number;

  @IsOptional()
  offset?: number;
}
