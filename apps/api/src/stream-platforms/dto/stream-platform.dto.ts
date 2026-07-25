import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { StreamPlatformStatus } from '../entities/stream-platform.entity';

export class CreateStreamPlatformDto {
  @IsUUID()
  streamId: string;

  @IsUUID()
  connectedAccountId: string;

  @IsString()
  @IsOptional()
  streamKey?: string;

  @IsString()
  @IsOptional()
  streamUrl?: string;

  @IsString()
  @IsOptional()
  platformStreamId?: string;

  @IsEnum(StreamPlatformStatus)
  @IsOptional()
  status?: StreamPlatformStatus;
}

export class UpdateStreamPlatformDto {
  @IsString()
  @IsOptional()
  streamKey?: string;

  @IsString()
  @IsOptional()
  streamUrl?: string;

  @IsString()
  @IsOptional()
  platformStreamId?: string;

  @IsEnum(StreamPlatformStatus)
  @IsOptional()
  status?: StreamPlatformStatus;
}
