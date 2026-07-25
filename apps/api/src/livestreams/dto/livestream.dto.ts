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
  @Length(5, 150)
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
  @IsUUID(undefined, { each: true })
  connectedAccountIds: string[];
}

export class UpdateStreamDto {
  @IsString()
  @IsOptional()
  @Length(5, 150)
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
}

export class ScheduleStreamDto {
  @IsString()
  @IsNotEmpty()
  scheduledAt: string;
}
