import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsIn,
  Min,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PlanStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  QUARTERLY = 'QUARTERLY',
}

export enum BillingType {
  RECURRING = 'RECURRING',
  ONE_TIME = 'ONE_TIME',
}

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  currency?: string = 'INR';

  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @IsEnum(BillingType)
  @IsOptional()
  billingType?: BillingType = BillingType.RECURRING;

  @IsNumber()
  @IsOptional()
  @Min(1)
  durationDays?: number;

  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  displayOrder?: number;

  // Limits (-1 is the explicit standard for unlimited)
  @IsNumber()
  @Min(-1)
  workspaceLimit: number;

  @IsNumber()
  @Min(-1)
  teamMemberLimit: number;

  @IsNumber()
  @Min(-1)
  socialAccountLimit: number;

  @IsNumber()
  @Min(-1)
  storageLimit: number;

  @IsNumber()
  @IsOptional()
  @Min(-1)
  liveStreamLimit?: number;

  @IsNumber()
  @IsOptional()
  @Min(-1)
  maxStreams?: number;

  @IsNumber()
  @IsOptional()
  @Min(-1)
  maxScheduledPosts?: number;

  @IsNumber()
  @IsOptional()
  @Min(-1)
  aiLimit?: number;

  // Features
  @IsBoolean()
  analytics: boolean;

  @IsBoolean()
  scheduling: boolean;

  @IsBoolean()
  aiFeatures: boolean;

  @IsBoolean()
  @IsOptional()
  liveStreaming?: boolean;

  @IsBoolean()
  @IsOptional()
  mediaLibrary?: boolean;

  @IsBoolean()
  @IsOptional()
  multiPlatformStreaming?: boolean;

  @IsBoolean()
  apiAccess: boolean;

  @IsBoolean()
  @IsOptional()
  customBranding?: boolean;

  @IsString()
  @IsIn(['STANDARD', 'PRIORITY', 'PREMIUM'])
  support: string;
}

export class UpdatePlanDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @IsEnum(BillingType)
  @IsOptional()
  billingType?: BillingType;

  @IsNumber()
  @IsOptional()
  @Min(1)
  durationDays?: number;

  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  displayOrder?: number;

  @IsNumber()
  @Min(-1)
  @IsOptional()
  workspaceLimit?: number;

  @IsNumber()
  @Min(-1)
  @IsOptional()
  teamMemberLimit?: number;

  @IsNumber()
  @Min(-1)
  @IsOptional()
  socialAccountLimit?: number;

  @IsNumber()
  @Min(-1)
  @IsOptional()
  storageLimit?: number;

  @IsNumber()
  @IsOptional()
  @Min(-1)
  liveStreamLimit?: number;

  @IsNumber()
  @IsOptional()
  @Min(-1)
  maxStreams?: number;

  @IsNumber()
  @IsOptional()
  @Min(-1)
  maxScheduledPosts?: number;

  @IsNumber()
  @IsOptional()
  @Min(-1)
  aiLimit?: number;

  @IsBoolean()
  @IsOptional()
  analytics?: boolean;

  @IsBoolean()
  @IsOptional()
  scheduling?: boolean;

  @IsBoolean()
  @IsOptional()
  aiFeatures?: boolean;

  @IsBoolean()
  @IsOptional()
  liveStreaming?: boolean;

  @IsBoolean()
  @IsOptional()
  mediaLibrary?: boolean;

  @IsBoolean()
  @IsOptional()
  multiPlatformStreaming?: boolean;

  @IsBoolean()
  @IsOptional()
  apiAccess?: boolean;

  @IsBoolean()
  @IsOptional()
  customBranding?: boolean;

  @IsString()
  @IsIn(['STANDARD', 'PRIORITY', 'PREMIUM'])
  @IsOptional()
  support?: string;
}

export class PlanListQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(PlanStatus)
  @IsOptional()
  status?: PlanStatus;

  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsIn(['ASC', 'DESC'])
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';

  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

export class UpdatePlanStatusDto {
  @IsEnum(PlanStatus)
  status: PlanStatus;
}

