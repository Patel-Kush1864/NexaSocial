import { IsString, IsEnum, IsOptional } from 'class-validator';

export class CreatePaymentOrderDto {
  @IsString()
  planId: string;

  @IsEnum(['STRIPE', 'RAZORPAY'])
  gateway: 'STRIPE' | 'RAZORPAY';

  @IsString()
  @IsOptional()
  currency?: string;
}
