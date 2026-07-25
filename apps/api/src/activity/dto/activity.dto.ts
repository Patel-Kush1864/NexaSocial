import { IsString, IsOptional, IsUUID, IsObject } from 'class-validator';

export class CreateActivityDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  @IsOptional()
  workspaceId?: string;

  @IsString()
  action: string;

  @IsString()
  @IsOptional()
  module?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class QueryActivityDto {
  @IsUUID()
  @IsOptional()
  workspaceId?: string;

  @IsString()
  @IsOptional()
  module?: string;

  @IsOptional()
  limit?: number;

  @IsOptional()
  offset?: number;
}
