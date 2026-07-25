/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentGateway, CreateOrderResult } from './payment-gateway.interface';

@Injectable()
export class StripeGateway implements PaymentGateway {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeGateway.name);

  constructor(private readonly configService: ConfigService) {
    const secretKey =
      this.configService.get<string>('STRIPE_SECRET_KEY') || 'sk_test_dummy';
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-02-02-preview' as any,
    });
  }

  async createOrder(
    paymentId: string,
    amount: number,
    currency: string,
    metadata?: Record<string, any>,
  ): Promise<CreateOrderResult> {
    try {
      // In Stripe, we create a PaymentIntent. Stripe amounts are in smallest currency units (cents).
      const amountInCents = Math.round(amount * 100);
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        metadata: {
          paymentId,
          ...metadata,
        },
      });

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined,
        raw: paymentIntent,
      };
    } catch (error: any) {
      this.logger.warn(
        `Stripe API error: ${error.message}. Checking for mock fallback.`,
      );
      const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
      if (!secretKey || secretKey === 'sk_test_dummy') {
        this.logger.log(
          'Fallback: generating mockup Stripe PaymentIntent credentials',
        );
        return {
          id: `pi_mock_${Math.random().toString(36).substring(2, 15)}`,
          clientSecret: `seti_mock_secret_${Math.random().toString(36).substring(2, 15)}`,
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
      if (!secret || secret === 'whsec_dummy') {
        this.logger.log(
          'Skipping verification: using dummy Stripe webhook secret',
        );
        return true;
      }
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        secret,
      );
      return !!event;
    } catch (error: any) {
      this.logger.error(
        `Stripe signature verification failed: ${error.message}`,
      );
      return false;
    }
  }
}
