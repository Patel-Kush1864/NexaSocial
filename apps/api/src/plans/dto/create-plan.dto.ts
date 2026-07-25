import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsObject,
} from 'class-validator';
import type { PlanFeatures } from '../entities/plan.entity';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  price: number;

  @IsString()
  @IsOptional()
  interval?: string;

  @IsObject()
  features: PlanFeatures;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
