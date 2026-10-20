import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  Min,
  IsIn,
} from 'class-validator';
import { Exclude, Expose } from 'class-transformer';

export class UpdateUserStatusDto {
  @IsBoolean()
  isActive: boolean;
}

export class UpdateWorkspaceStatusDto {
  @IsString()
  status: string; // 'ACTIVE', 'SUSPENDED', 'ARCHIVED'
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

export interface DashboardKpiMetric {
  value: number | string;
  change: number;
  direction: 'up' | 'down' | 'neutral';
  currency?: string;
}

export interface PlatformDashboardKpis {
  totalUsers: DashboardKpiMetric;
  workspaces: DashboardKpiMetric;
  subscriptions: DashboardKpiMetric;
  revenue: DashboardKpiMetric;
  connectedAccounts: DashboardKpiMetric;
  liveStreams: DashboardKpiMetric;
  activeUsers: DashboardKpiMetric;
  failedPayments: DashboardKpiMetric;
  period: {
    current: string;
    previous: string;
  };
}

export class QueryWorkspacesDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  @IsIn([10, 20, 50, 100])
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}

@Exclude()
export class WorkspaceAdminDetailsResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() slug: string;
  @Expose() status: string;
  @Expose() logo?: string;
  @Expose() description?: string;
  @Expose() timezone: string;
  @Expose() created_at: Date;
  @Expose() owner: any;
  @Expose() memberCount: number;
  @Expose() socialAccountCount: number;
  @Expose() streamCount: number;
  @Expose() subscription: any;
}
