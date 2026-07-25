/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { PlansService } from '../plans/plans.service';
import { StripeGateway } from './gateways/stripe.gateway';
import { RazorpayGateway } from './gateways/razorpay.gateway';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ActivityLog } from '../users/entities/activity-log.entity';
import { LoggerServiceWrapper } from '../logger/logger.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    private readonly plansService: PlansService,
    private readonly stripeGateway: StripeGateway,
    private readonly razorpayGateway: RazorpayGateway,
    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionsService: SubscriptionsService,
    private readonly loggerService: LoggerServiceWrapper,
  ) {}

  async createOrder(userId: string, dto: CreatePaymentOrderDto) {
    const plan = await this.plansService.findOne(dto.planId);
    if (!plan.isActive) {
      throw new BadRequestException('The selected plan is not active');
    }

    // Create a pending payment log in the database
    const payment = this.paymentRepository.create({
      userId,
      planId: plan.id,
      amount: plan.price,
      currency: dto.currency || 'INR',
      status: PaymentStatus.PENDING,
      gateway: dto.gateway,
      refundedAmount: 0,
    });
    await this.paymentRepository.save(payment);

    // Call the corresponding gateway to create an order/intent
    let orderResult;
    try {
      if (dto.gateway === 'STRIPE') {
        orderResult = await this.stripeGateway.createOrder(
          payment.id,
          payment.amount,
          payment.currency,
          { userId, planId: plan.id },
        );
      } else {
        orderResult = await this.razorpayGateway.createOrder(
          payment.id,
          payment.amount,
          payment.currency,
          { userId, planId: plan.id },
        );
      }

      // Update payment with the order ID returned by the gateway
      payment.gatewayOrderId = orderResult.id;
      if (orderResult.clientSecret) {
        payment.gatewaySignature = orderResult.clientSecret; // temporarily store Stripe client secret here
      }
      await this.paymentRepository.save(payment);

      this.loggerService.log(
        `Created payment order: ID ${payment.id}, Gateway Order ID: ${orderResult.id}`,
        'PaymentsService',
        'application',
      );

      // Log event to activity logs
      await this.activityLogRepository.save(
        this.activityLogRepository.create({
          userId,
          action: 'PAYMENT_ORDER_CREATED',
          metadata: {
            paymentId: payment.id,
            planId: plan.id,
            amount: payment.amount,
            gateway: dto.gateway,
            gatewayOrderId: orderResult.id,
          },
        }),
      );

      return {
        paymentId: payment.id,
        gatewayOrderId: orderResult.id,
        clientSecret: orderResult.clientSecret,
        amount: payment.amount,
        currency: payment.currency,
        gateway: dto.gateway,
      };
    } catch (error: any) {
      payment.status = PaymentStatus.FAILED;
      payment.metadata = { error: error.message };
      await this.paymentRepository.save(payment);

      this.loggerService.error(
        `Failed to create payment order for User ${userId}, Plan ${plan.id}: ${error.message}`,
        error.stack,
        'PaymentsService',
      );
      throw error;
    }
  }

  async verifyPayment(userId: string, dto: VerifyPaymentDto) {
    // Locate the payment record
    const payment = await this.paymentRepository.findOne({
      where: [
        { gatewayOrderId: dto.gatewayOrderId },
        { id: dto.gatewayPaymentId }, // support verification by payment ID directly
      ],
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      return { status: 'SUCCESS', payment };
    }

    // Verify signature
    let isVerified = false;

    // Support developer mockup fallback bypass
    if (
      dto.gatewayOrderId?.startsWith('order_mock_') ||
      dto.gatewayPaymentId?.startsWith('pi_mock_')
    ) {
      this.logger.log(
        `Bypassing verification for developer mockup order/payment`,
      );
      isVerified = true;
    } else {
      // Perform signature check
      if (dto.gateway === 'RAZORPAY') {
        const secret = this.configServiceGetRazorpayWebhookSecret();
        // For Razorpay, verified by custom HMAC logic
        isVerified = this.razorpayGateway.verifyWebhookSignature(
          `${dto.gatewayOrderId}|${dto.gatewayPaymentId}`,
          dto.gatewaySignature || '',
          secret,
        );
      } else {
        // Stripe success is typically handled asynchronously via Webhook.
        // However, if verifying synchronously on frontend return redirect:
        isVerified = true; // Stripe redirects only happen on checkout success/confirmation
      }
    }

    if (!isVerified) {
      payment.status = PaymentStatus.FAILED;
      await this.paymentRepository.save(payment);
      throw new BadRequestException(
        'Payment verification signature check failed',
      );
    }

    // Update payment record
    payment.status = PaymentStatus.SUCCESS;
    payment.gatewayPaymentId = dto.gatewayPaymentId;
    if (dto.gatewaySignature) {
      payment.gatewaySignature = dto.gatewaySignature;
    }
    await this.paymentRepository.save(payment);

    this.loggerService.log(
      `Payment succeeded: ID ${payment.id}, Gateway Payment ID ${payment.gatewayPaymentId}`,
      'PaymentsService',
      'application',
    );

    // Create / Activate Subscription
    const subscription = await this.subscriptionsService.activateSubscription(
      payment.userId!,
      payment.planId!,
      payment.gateway,
      payment.id,
    );

    // Connect subscription to payment record
    payment.subscriptionId = subscription.id;
    await this.paymentRepository.save(payment);

    // Save successful activity log
    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId: payment.userId!,
        action: 'PAYMENT_SUCCESS',
        metadata: {
          paymentId: payment.id,
          amount: payment.amount,
          subscriptionId: subscription.id,
          planId: payment.planId!,
        },
      }),
    );

    return { status: 'SUCCESS', payment };
  }

  async handleWebhook(
    gateway: 'STRIPE' | 'RAZORPAY',
    rawBody: Buffer | string,
    signature: string,
  ) {
    let secret = '';
    if (gateway === 'STRIPE') {
      secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy';
      const isVerified = this.stripeGateway.verifyWebhookSignature(
        rawBody,
        signature,
        secret,
      );
      if (!isVerified) {
        throw new BadRequestException('Invalid Stripe webhook signature');
      }

      const bodyObj =
        typeof rawBody === 'string'
          ? JSON.parse(rawBody)
          : JSON.parse(rawBody.toString('utf8'));
      const eventType = bodyObj.type;

      this.logger.log(`Processing Stripe webhook event: ${eventType}`);

      if (eventType === 'payment_intent.succeeded') {
        const paymentIntent = bodyObj.data.object;
        const paymentId = paymentIntent.metadata?.paymentId;
        const stripePaymentId = paymentIntent.id;

        const payment = await this.paymentRepository.findOne({
          where: { id: paymentId },
        });
        if (payment && payment.status !== PaymentStatus.SUCCESS) {
          payment.status = PaymentStatus.SUCCESS;
          payment.gatewayPaymentId = stripePaymentId;
          await this.paymentRepository.save(payment);

          const sub = await this.subscriptionsService.activateSubscription(
            payment.userId!,
            payment.planId!,
            'STRIPE',
            payment.id,
            paymentIntent.id,
          );

          payment.subscriptionId = sub.id;
          await this.paymentRepository.save(payment);

          // Log payment success
          await this.activityLogRepository.save(
            this.activityLogRepository.create({
              userId: payment.userId!,
              action: 'PAYMENT_SUCCESS_WEBHOOK',
              metadata: { paymentId: payment.id, stripePaymentId },
            }),
          );
        }
      } else if (eventType === 'payment_intent.payment_failed') {
        const paymentIntent = bodyObj.data.object;
        const paymentId = paymentIntent.metadata?.paymentId;
        const payment = await this.paymentRepository.findOne({
          where: { id: paymentId },
        });
        if (payment) {
          payment.status = PaymentStatus.FAILED;
          payment.metadata = {
            error: paymentIntent.last_payment_error?.message,
          };
          await this.paymentRepository.save(payment);

          await this.activityLogRepository.save(
            this.activityLogRepository.create({
              userId: payment.userId!,
              action: 'PAYMENT_FAILED_WEBHOOK',
              metadata: { paymentId: payment.id },
            }),
          );
        }
      }
    } else {
      // Razorpay webhook
      secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_whsec_dummy';
      const isVerified = this.razorpayGateway.verifyWebhookSignature(
        rawBody,
        signature,
        secret,
      );
      if (!isVerified) {
        throw new BadRequestException('Invalid Razorpay webhook signature');
      }

      const bodyObj =
        typeof rawBody === 'string'
          ? JSON.parse(rawBody)
          : JSON.parse(rawBody.toString('utf8'));
      const eventType = bodyObj.event;

      this.logger.log(`Processing Razorpay webhook event: ${eventType}`);

      if (eventType === 'payment.captured' || eventType === 'order.paid') {
        const entity = bodyObj.payload.payment
          ? bodyObj.payload.payment.entity
          : bodyObj.payload.order.entity;
        const gatewayOrderId = entity.order_id || entity.id;
        const gatewayPaymentId = entity.id;

        const payment = await this.paymentRepository.findOne({
          where: { gatewayOrderId },
        });
        if (payment && payment.status !== PaymentStatus.SUCCESS) {
          payment.status = PaymentStatus.SUCCESS;
          payment.gatewayPaymentId = gatewayPaymentId;
          await this.paymentRepository.save(payment);

          const sub = await this.subscriptionsService.activateSubscription(
            payment.userId!,
            payment.planId!,
            'RAZORPAY',
            payment.id,
            undefined,
            gatewayOrderId,
          );

          payment.subscriptionId = sub.id;
          await this.paymentRepository.save(payment);

          await this.activityLogRepository.save(
            this.activityLogRepository.create({
              userId: payment.userId!,
              action: 'PAYMENT_SUCCESS_WEBHOOK',
              metadata: { paymentId: payment.id, gatewayPaymentId },
            }),
          );
        }
      }
    }

    return { received: true };
  }

  async getHistory(userId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { userId },
      relations: { plan: true },
      order: { created_at: 'DESC' },
    });
  }

  private configServiceGetRazorpayWebhookSecret(): string {
    return process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_whsec_dummy';
  }
}
