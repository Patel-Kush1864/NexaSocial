import { IsString, IsEnum, IsOptional } from 'class-validator';

export class PurchaseSubscriptionDto {
  @IsString()
  planId: string;

  @IsEnum(['STRIPE', 'RAZORPAY'])
  @IsOptional()
  gateway?: 'STRIPE' | 'RAZORPAY';
}
