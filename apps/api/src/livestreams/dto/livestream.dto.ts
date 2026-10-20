import {
  IsString,
  Length,
  IsOptional,
  MaxLength,
  IsEnum,
  IsArray,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { StreamVisibility } from '../entities/livestream.entity';
import { IsThumbnailFormat } from '../validators/is-thumbnail-format.validator';

export class CreateStreamDto {
  @IsString()
  @Length(3, 150)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @IsString()
  @IsOptional()
  @IsThumbnailFormat()
  thumbnail?: string;

  @IsEnum(StreamVisibility)
  @IsOptional()
  visibility?: StreamVisibility;

  @IsString()
  @IsOptional()
  scheduledAt?: string;

  @IsArray()
  @IsOptional()
  @IsUUID(undefined, { each: true })
  connectedAccountIds?: string[];

  @IsArray()
  @IsOptional()
  @IsUUID(undefined, { each: true })
  platformAccountIds?: string[];

  @IsString()
  @IsOptional()
  youtubeStreamKey?: string;

  @IsString()
  @IsOptional()
  customStreamKey?: string;
}

export class UpdateStreamDto {
  @IsString()
  @IsOptional()
  @Length(3, 150)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @IsString()
  @IsOptional()
  @IsThumbnailFormat()
  thumbnail?: string;

  @IsEnum(StreamVisibility)
  @IsOptional()
  visibility?: StreamVisibility;

  @IsString()
  @IsOptional()
  scheduledAt?: string;

  @IsArray()
  @IsOptional()
  @IsUUID(undefined, { each: true })
  connectedAccountIds?: string[];

  @IsArray()
  @IsOptional()
  @IsUUID(undefined, { each: true })
  platformAccountIds?: string[];

  @IsString()
  @IsOptional()
  youtubeStreamKey?: string;

  @IsString()
  @IsOptional()
  customStreamKey?: string;

  @IsString()
  @IsOptional()
  customStreamUrl?: string;

  @IsString()
  @IsOptional()
  platformId?: string;
}

export class ScheduleStreamDto {
  @IsString()
  @IsNotEmpty()
  scheduledAt: string;
}

export class FacebookSourceDto {
  @IsString()
  @IsOptional()
  platformId?: string;

  @IsString()
  @IsOptional()
  streamUrl?: string;

  @IsString()
  @IsOptional()
  streamKey?: string;

  @IsString()
  @IsOptional()
  customStreamUrl?: string;

  @IsString()
  @IsOptional()
  customStreamKey?: string;
}

export class FacebookMetadataDto {
  @IsString()
  @IsOptional()
  platformId?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  pageId?: string;
}

export class FacebookPublishDto {
  @IsString()
  @IsOptional()
  platformId?: string;
}
