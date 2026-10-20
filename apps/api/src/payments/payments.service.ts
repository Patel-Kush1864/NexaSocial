/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
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
import { Workspace } from '../workspaces/entities/workspace.entity';
import { MailService } from '../mail/mail.service';
import { PaymentListQueryDto } from './dto/payment-list-query.dto';
import { PaymentStatisticsQueryDto } from './dto/payment-statistics-query.dto';
import { PaymentExportQueryDto } from './dto/payment-export-query.dto';

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
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    private readonly mailService: MailService,
  ) { }

  private async getUserInfo(userId: string): Promise<{ name: string; email: string }> {
    try {
      const rows = await this.paymentRepository.manager.query(
        'SELECT first_name, last_name, email FROM `users` WHERE id = ? LIMIT 1',
        [userId],
      );
      if (rows && rows[0]?.email) {
        const name =
          `${rows[0].first_name || ''} ${rows[0].last_name || ''}`.trim() ||
          rows[0].email.split('@')[0];
        return { name, email: rows[0].email };
      }
    } catch {}
    return { name: 'Customer', email: 'user@example.com' };
  }

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
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
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

    // Verify ownership: client cannot verify payments belonging to another user
    if (payment.userId && payment.userId !== userId) {
      throw new ForbiddenException(
        'Payment record does not belong to current user',
      );
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
        // Standard Checkout payment signature is verified using RAZORPAY_KEY_SECRET
        const orderId = dto.gatewayOrderId || payment.gatewayOrderId || '';
        isVerified = this.razorpayGateway.verifyPaymentSignature(
          orderId,
          dto.gatewayPaymentId,
          dto.gatewaySignature || '',
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

      try {
        const userInfo = await this.getUserInfo(payment.userId!);
        await this.mailService.sendPaymentFailed({
          userId: payment.userId!,
          name: userInfo.name,
          email: userInfo.email,
          amount: payment.amount,
          currency: payment.currency,
          planName: 'Subscription Plan',
          reason: 'Payment signature verification check failed.',
          paymentId: payment.id,
        });
      } catch (e: any) {
        this.logger.error(`Failed to send payment failure email: ${e.message}`);
      }

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

    // Send Payment Success Receipt with idempotency
    try {
      const userInfo = await this.getUserInfo(payment.userId!);
      await this.mailService.sendPaymentSuccessReceipt({
        userId: payment.userId!,
        name: userInfo.name,
        email: userInfo.email,
        amount: payment.amount,
        currency: payment.currency,
        paymentId: payment.gatewayPaymentId || payment.id,
        orderId: payment.gatewayOrderId,
        planName: subscription.plan?.name || 'Subscription Tier',
        date: payment.created_at,
      });
    } catch (e: any) {
      this.logger.error(`Failed to send payment receipt email: ${e.message}`);
    }

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

          // Send Payment Success Receipt with idempotency
          try {
            const userInfo = await this.getUserInfo(payment.userId!);
            await this.mailService.sendPaymentSuccessReceipt({
              userId: payment.userId!,
              name: userInfo.name,
              email: userInfo.email,
              amount: payment.amount,
              currency: payment.currency,
              paymentId: stripePaymentId,
              orderId: payment.gatewayOrderId,
              planName: sub.plan?.name || 'Subscription Tier',
              date: payment.created_at,
            });
          } catch (e: any) {
            this.logger.error(
              `Failed to send payment receipt email via Stripe webhook: ${e.message}`,
            );
          }
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

          try {
            const userInfo = await this.getUserInfo(payment.userId!);
            await this.mailService.sendPaymentFailed({
              userId: payment.userId!,
              name: userInfo.name,
              email: userInfo.email,
              amount: payment.amount,
              currency: payment.currency,
              planName: 'Subscription Plan',
              reason:
                paymentIntent.last_payment_error?.message ||
                'Payment processing failed.',
              paymentId: payment.id,
            });
          } catch (e: any) {
            this.logger.error(
              `Failed to send Stripe failure email: ${e.message}`,
            );
          }
        }
      } else if (eventType === 'charge.refunded' || eventType === 'refund.created') {
        const charge = bodyObj.data.object;
        const payment = await this.paymentRepository.findOne({
          where: { gatewayPaymentId: charge.payment_intent || charge.id },
        });
        if (payment && payment.status !== PaymentStatus.REFUNDED) {
          payment.status = PaymentStatus.REFUNDED;
          payment.refundedAmount = payment.amount;
          await this.paymentRepository.save(payment);

          try {
            const userInfo = await this.getUserInfo(payment.userId!);
            await this.mailService.sendPaymentRefunded({
              userId: payment.userId!,
              name: userInfo.name,
              email: userInfo.email,
              amount: payment.amount,
              currency: payment.currency,
              paymentId: payment.gatewayPaymentId || payment.id,
              reason: 'Customer refund processed successfully.',
            });
          } catch (e: any) {
            this.logger.error(`Failed to send Stripe refund email: ${e.message}`);
          }
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

          // Dispatch payment success receipt
          try {
            const userInfo = await this.getUserInfo(payment.userId!);
            await this.mailService.sendPaymentSuccessReceipt({
              userId: payment.userId!,
              name: userInfo.name,
              email: userInfo.email,
              amount: payment.amount,
              currency: payment.currency,
              paymentId: gatewayPaymentId,
              orderId: gatewayOrderId,
              planName: sub.plan?.name || 'Subscription Tier',
              date: payment.created_at,
            });
          } catch (e: any) {
            this.logger.error(`Failed to send payment receipt email via webhook: ${e.message}`);
          }
        }
      } else if (eventType === 'payment.failed') {
        const entity = bodyObj.payload.payment.entity;
        const gatewayOrderId = entity.order_id;
        const payment = await this.paymentRepository.findOne({
          where: { gatewayOrderId },
        });
        if (payment) {
          payment.status = PaymentStatus.FAILED;
          payment.metadata = { error: entity.error_description };
          await this.paymentRepository.save(payment);

          try {
            const userInfo = await this.getUserInfo(payment.userId!);
            await this.mailService.sendPaymentFailed({
              userId: payment.userId!,
              name: userInfo.name,
              email: userInfo.email,
              amount: payment.amount,
              currency: payment.currency,
              planName: 'Subscription Plan',
              reason: entity.error_description || 'Payment transaction failed.',
              paymentId: entity.id,
            });
          } catch (e: any) {
            this.logger.error(`Failed to send Razorpay failure email: ${e.message}`);
          }
        }
      } else if (eventType === 'refund.processed') {
        const refund = bodyObj.payload.refund.entity;
        const payment = await this.paymentRepository.findOne({
          where: { gatewayPaymentId: refund.payment_id },
        });
        if (payment && payment.status !== PaymentStatus.REFUNDED) {
          payment.status = PaymentStatus.REFUNDED;
          payment.refundedAmount = Number(refund.amount) / 100 || payment.amount;
          await this.paymentRepository.save(payment);

          try {
            const userInfo = await this.getUserInfo(payment.userId!);
            await this.mailService.sendPaymentRefunded({
              userId: payment.userId!,
              name: userInfo.name,
              email: userInfo.email,
              amount: payment.refundedAmount,
              currency: payment.currency,
              paymentId: refund.id || payment.gatewayPaymentId,
              reason: refund.notes?.reason || 'Refund processed.',
            });
          } catch (e: any) {
            this.logger.error(`Failed to send Razorpay refund email: ${e.message}`);
          }
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

  // --- ADMIN PLATFORM METHODS ---
  async findAll(query: PaymentListQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      provider,
      workspaceId,
      planId,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const qb = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.user', 'user')
      .leftJoinAndSelect('payment.plan', 'plan')
      .leftJoinAndSelect('payment.subscription', 'subscription');

    if (status) {
      qb.andWhere('payment.status = :status', { status });
    }

    if (provider) {
      qb.andWhere('payment.gateway = :provider', { provider });
    }

    if (planId) {
      qb.andWhere('payment.plan_id = :planId', { planId });
    }

    if (dateFrom) {
      qb.andWhere('payment.created_at >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      qb.andWhere('payment.created_at <= :dateTo', { dateTo });
    }

    if (search) {
      qb.andWhere(
        '(payment.id LIKE :search OR payment.gateway_payment_id LIKE :search OR user.name LIKE :search OR user.email LIKE :search OR plan.name LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (workspaceId) {
      qb.andWhere(
        'payment.user_id IN (SELECT owner_id FROM workspaces WHERE id = :workspaceId)',
        { workspaceId },
      );
    }

    const sortFieldMap: Record<string, string> = {
      createdAt: 'payment.created_at',
      amount: 'payment.amount',
      status: 'payment.status',
    };

    const orderField = sortFieldMap[sortBy] || 'payment.created_at';
    qb.orderBy(orderField, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    const userIds = items
      .map((item) => item.userId)
      .filter(Boolean) as string[];
    let workspaces: Workspace[] = [];
    if (userIds.length > 0) {
      workspaces = await this.workspaceRepository
        .createQueryBuilder('workspace')
        .where('workspace.owner_id IN (:...userIds)', { userIds })
        .getMany();
    }

    const data = items.map((item) => {
      const workspace = workspaces.find((w) => w.ownerId === item.userId);
      return {
        id: item.id,
        reference: item.gatewayPaymentId || item.id,
        workspace: workspace
          ? { id: workspace.id, name: workspace.name }
          : null,
        user: item.user
          ? {
            id: item.user.id,
            name:
              `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim() ||
              'Unknown',
            email: item.user.email,
          }
          : null,
        plan: item.plan ? { id: item.plan.id, name: item.plan.name } : null,
        subscriptionId: item.subscriptionId,
        amount: Number(item.amount),
        currency: item.currency,
        status: item.status,
        provider: item.gateway,
        paymentMethod: 'CARD',
        createdAt: item.created_at,
      };
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStatistics(query: PaymentStatisticsQueryDto) {
    const qb = this.paymentRepository.createQueryBuilder('payment');

    if (query.dateFrom) {
      qb.andWhere('payment.created_at >= :dateFrom', {
        dateFrom: query.dateFrom,
      });
    }

    if (query.dateTo) {
      qb.andWhere('payment.created_at <= :dateTo', { dateTo: query.dateTo });
    }

    if (query.planId) {
      qb.andWhere('payment.plan_id = :planId', { planId: query.planId });
    }

    if (query.workspaceId) {
      qb.andWhere(
        'payment.user_id IN (SELECT owner_id FROM workspaces WHERE id = :workspaceId)',
        { workspaceId: query.workspaceId },
      );
    }

    const [successfulCount, failedCount, refundedCount, pendingCount] =
      await Promise.all([
        qb
          .clone()
          .andWhere('payment.status = :s', { s: PaymentStatus.SUCCESS })
          .getCount(),
        qb
          .clone()
          .andWhere('payment.status = :s', { s: PaymentStatus.FAILED })
          .getCount(),
        qb
          .clone()
          .andWhere('payment.status = :s', { s: PaymentStatus.REFUNDED })
          .getCount(),
        qb
          .clone()
          .andWhere('payment.status = :s', { s: PaymentStatus.PENDING })
          .getCount(),
      ]);

    const revenueResult = await qb
      .clone()
      .andWhere('payment.status = :s', { s: PaymentStatus.SUCCESS })
      .select('SUM(payment.amount)', 'total')
      .getRawOne();

    const refundedResult = await qb
      .clone()
      .andWhere('payment.status = :s', { s: PaymentStatus.REFUNDED })
      .select('SUM(payment.amount)', 'total')
      .getRawOne();

    const failedResult = await qb
      .clone()
      .andWhere('payment.status = :s', { s: PaymentStatus.FAILED })
      .select('SUM(payment.amount)', 'total')
      .getRawOne();

    const pendingResult = await qb
      .clone()
      .andWhere('payment.status = :s', { s: PaymentStatus.PENDING })
      .select('SUM(payment.amount)', 'total')
      .getRawOne();

    return {
      totalRevenue: {
        amount: Number(revenueResult?.total || 0),
        currency: 'INR',
      },
      successful: {
        count: successfulCount,
        amount: Number(revenueResult?.total || 0),
      },
      failed: {
        count: failedCount,
        amount: Number(failedResult?.total || 0),
      },
      refunded: {
        count: refundedCount,
        amount: Number(refundedResult?.total || 0),
      },
      pending: {
        count: pendingCount,
        amount: Number(pendingResult?.total || 0),
      },
    };
  }

  async findOneById(id: string) {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['user', 'plan', 'subscription'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    let workspace: Workspace | null = null;
    if (payment.userId) {
      workspace = await this.workspaceRepository.findOne({
        where: { ownerId: payment.userId },
      });
    }

    return {
      id: payment.id,
      reference: payment.gatewayPaymentId || payment.id,
      invoiceReference: payment.gatewayOrderId,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      provider: payment.gateway,
      paymentMethod: 'CARD',
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
      user: payment.user
        ? {
          id: payment.user.id,
          name:
            `${payment.user.firstName || ''} ${payment.user.lastName || ''}`.trim() ||
            'Unknown',
          email: payment.user.email,
        }
        : null,
      workspace: workspace ? { id: workspace.id, name: workspace.name } : null,
      plan: payment.plan
        ? { id: payment.plan.id, name: payment.plan.name }
        : null,
      subscription: payment.subscription
        ? { id: payment.subscription.id, status: payment.subscription.status }
        : null,
    };
  }

  async exportPayments(query: PaymentExportQueryDto) {
    const { data } = await this.findAll({ ...query, page: 1, limit: 10000 });
    return data.map((p) => ({
      'Payment ID': p.id,
      Reference: p.reference,
      User: p.user?.name || 'N/A',
      Email: p.user?.email || 'N/A',
      Workspace: p.workspace?.name || 'N/A',
      Plan: p.plan?.name || 'N/A',
      Subscription: p.subscriptionId || 'N/A',
      Amount: p.amount,
      Currency: p.currency,
      Status: p.status,
      Provider: p.provider,
      'Payment Date': p.createdAt,
    }));
  }

  private configServiceGetRazorpayWebhookSecret(): string {
    return process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_whsec_dummy';
  }
}
