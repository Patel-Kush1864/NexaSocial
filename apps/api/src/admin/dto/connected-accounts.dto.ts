import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsEnum,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AccountStatus } from '../../social/entities/connected-account.entity';

export class AdminGetConnectedAccountsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn([10, 20, 50, 100])
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
