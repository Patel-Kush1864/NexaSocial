import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleFeatureFlagDto {
  @ApiProperty({ description: 'The new state of the feature flag' })
  @IsBoolean()
  enabled: boolean;
}
