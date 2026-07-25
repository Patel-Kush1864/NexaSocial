import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  Min,
} from 'class-validator';

export class UpdateUserStatusDto {
  @IsBoolean()
  isActive: boolean;
}

export class UpdateWorkspaceStatusDto {
  @IsBoolean()
  isActive: boolean;
}

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  billingCycle: string;

  @IsNumber()
  workspacesLimit: number;

  @IsNumber()
  socialAccountsLimit: number;

  @IsNumber()
  teamMembersLimit: number;

  @IsNumber()
  storageLimit: number;

  @IsBoolean()
  aiFeatures: boolean;
}

export class UpdatePlanDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @IsString()
  @IsOptional()
  billingCycle?: string;

  @IsNumber()
  @IsOptional()
  workspacesLimit?: number;

  @IsNumber()
  @IsOptional()
  socialAccountsLimit?: number;

  @IsNumber()
  @IsOptional()
  teamMembersLimit?: number;

  @IsNumber()
  @IsOptional()
  storageLimit?: number;

  @IsBoolean()
  @IsOptional()
  aiFeatures?: boolean;
}

export class UpdateSocialPlatformConfigDto {
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  clientSecret?: string;
}
