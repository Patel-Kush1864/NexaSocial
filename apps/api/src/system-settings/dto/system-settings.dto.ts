import { IsString, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateSystemSettingDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class ToggleFeatureFlagDto {
  @IsBoolean()
  isEnabled: boolean;
}

export class SetMaintenanceModeDto {
  @IsBoolean()
  enabled: boolean;
}
