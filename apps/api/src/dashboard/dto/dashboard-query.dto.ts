import { IsOptional, IsUUID, IsString } from 'class-validator';

export class DashboardQueryDto {
  @IsUUID()
  @IsOptional()
  workspaceId?: string;

  @IsString()
  @IsOptional()
  widget?: string;
}
