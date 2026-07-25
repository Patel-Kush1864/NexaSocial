import {
  IsString,
  Length,
  IsOptional,
  MaxLength,
  IsObject,
} from 'class-validator';
import type { WorkspaceSettings } from '../entities/workspace.entity';

export class CreateWorkspaceDto {
  @IsString()
  @Length(3, 100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsObject()
  @IsOptional()
  settings?: WorkspaceSettings;
}

export class UpdateWorkspaceDto {
  @IsString()
  @IsOptional()
  @Length(3, 100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsObject()
  @IsOptional()
  settings?: WorkspaceSettings;
}

export class TransferOwnershipDto {
  @IsString()
  newOwnerId: string;

  @IsString()
  confirmPassword;
}
