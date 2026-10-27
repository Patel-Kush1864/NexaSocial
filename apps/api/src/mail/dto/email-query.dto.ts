import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { EmailStatus } from '../entities/email-log.entity';

export class EmailLogQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(EmailStatus)
  status?: EmailStatus;

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  recipient?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}

export class TestEmailDto {
  @IsOptional()
  @IsString()
  recipient?: string;
}

export class UpdateEmailPreferencesDto {
  @IsOptional()
  streamingEmails?: boolean;

  @IsOptional()
  socialEmails?: boolean;

  @IsOptional()
  workspaceEmails?: boolean;

  @IsOptional()
  marketingEmails?: boolean;
}
