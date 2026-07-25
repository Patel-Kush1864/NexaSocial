import { IsString, IsEnum, IsOptional } from 'class-validator';

export class VerifyPaymentDto {
  @IsEnum(['STRIPE', 'RAZORPAY'])
  gateway: 'STRIPE' | 'RAZORPAY';

  @IsString()
  @IsOptional()
  gatewayOrderId?: string;

  @IsString()
  gatewayPaymentId: string;

  @IsString()
  @IsOptional()
  gatewaySignature?: string;
}
