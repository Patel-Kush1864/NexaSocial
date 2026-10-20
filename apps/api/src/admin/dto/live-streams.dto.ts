import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsEnum,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StreamStatus } from '../../livestreams/entities/livestream.entity';

export class AdminGetLiveStreamsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn([10, 20, 50, 100])
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(StreamStatus)
  status?: StreamStatus;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  workspaceId?: string;

  @IsOptional()
  @IsString()
  creatorId?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
