/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PaymentGateway, CreateOrderResult } from './payment-gateway.interface';
import Razorpay from 'razorpay';

@Injectable()
export class RazorpayGateway implements PaymentGateway {
  private razorpay: Razorpay | null = null;
  private readonly logger = new Logger(RazorpayGateway.name);

  constructor(private readonly configService: ConfigService) {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    if (keyId && keySecret) {
      try {
        this.razorpay = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });
      } catch (e: any) {
        this.logger.error(`Failed to initialize Razorpay: ${e.message}`);
      }
    }
  }

  async createOrder(
    paymentId: string,
    amount: number,
    currency: string,
    metadata?: Record<string, any>,
  ): Promise<CreateOrderResult> {
    try {
      if (!this.razorpay) {
        throw new Error('Razorpay SDK is not initialized (missing API keys)');
      }
      const amountInPaise = Math.round(amount * 100);
      const order = await this.razorpay.orders.create({
        amount: amountInPaise,
        currency: currency.toUpperCase(),
        receipt: paymentId,
        notes: {
          paymentId,
          ...metadata,
        },
      });

      return {
        id: order.id,
        raw: order,
      };
    } catch (error: any) {
      this.logger.warn(
        `Razorpay API error: ${error.message}. Checking for mock fallback.`,
      );
      const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
      if (!keyId || keyId === 'rzp_test_dummy' || !this.razorpay) {
        this.logger.log(
          'Fallback: generating mockup Razorpay Order credentials',
        );
        return {
          id: `order_mock_${Math.random().toString(36).substring(2, 15)}`,
          raw: { mock: true, paymentId, amount, currency },
        };
      }
      throw error;
    }
  }

  verifyWebhookSignature(
    rawBody: Buffer | string,
    signature: string,
    secret: string,
  ): boolean {
    try {
      if (!secret || secret === 'rzp_whsec_dummy') {
        this.logger.log(
          'Skipping verification: using dummy Razorpay webhook secret',
        );
        return true;
      }
      const bodyStr = Buffer.isBuffer(rawBody)
        ? rawBody.toString('utf8')
        : rawBody;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(bodyStr)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error: any) {
      this.logger.error(
        `Razorpay signature verification failed: ${error.message}`,
      );
      return false;
    }
  }
}
