/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  UserSubscription,
  SubscriptionStatus,
} from './entities/user-subscription.entity';
import { PlansService } from '../plans/plans.service';
import { PaymentsService } from '../payments/payments.service';
import { ActivityLog } from '../users/entities/activity-log.entity';
import { LoggerServiceWrapper } from '../logger/logger.service';
import { MailService } from '../mail/mail.service';
import dayjs from 'dayjs';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(UserSubscription)
    private readonly userSubRepository: Repository<UserSubscription>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    private readonly plansService: PlansService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
    private readonly loggerService: LoggerServiceWrapper,
    private readonly mailService: MailService,
  ) {}

  async activateSubscription(
    userId: string,
    planId: string,
    gateway: string,
    paymentId?: string,
    stripeSubscriptionId?: string,
    razorpaySubscriptionId?: string,
  ): Promise<UserSubscription> {
    const plan = await this.plansService.findOne(planId);

    // Expire any existing active subscriptions for this user
    await this.userSubRepository.update(
      { userId, status: SubscriptionStatus.ACTIVE },
      { status: SubscriptionStatus.EXPIRED, endDate: new Date() },
    );

    const now = new Date();
    let endDate: Date | null = null;

    if (plan.name !== 'Enterprise') {
      endDate = dayjs(now).add(1, 'month').toDate();
    }

    const sub = this.userSubRepository.create({
      userId,
      planId: plan.id,
      status: SubscriptionStatus.ACTIVE,
      startDate: now,
      endDate,
      stripeSubscriptionId,
      razorpaySubscriptionId,
    });
    await this.userSubRepository.save(sub);

    this.loggerService.log(
      `Activated subscription for User ${userId}, Plan ${plan.name}`,
      'SubscriptionsService',
      'application',
    );

    // Log to activity logs
    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId,
        action: 'SUBSCRIPTION_ACTIVATED',
        metadata: {
          subscriptionId: sub.id,
          planId: plan.id,
          planName: plan.name,
          gateway,
          paymentId,
        },
      }),
    );

    // Send email alert to user
    try {
      await this.mailService.sendMail({
        to: 'user@example.com', // In real app, load user email
        subject: `NexaSocial Subscription Activated: ${plan.name}`,
        text: `Your ${plan.name} subscription has been activated successfully and is valid until ${endDate ? endDate.toLocaleDateString() : 'Unlimited'}.`,
        template: 'subscription-activated',
        context: {
          planName: plan.name,
          price: plan.price,
          endDate: endDate ? endDate.toLocaleDateString() : 'Unlimited',
        },
      });
    } catch (e: any) {
      this.logger.error(`Failed to send activation email: ${e.message}`);
    }

    return sub;
  }

  async getCurrentSubscription(userId: string): Promise<UserSubscription> {
    let sub = await this.userSubRepository.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      relations: { plan: true },
    });

    if (!sub) {
      // Find the 'Free' plan and auto-assign
      try {
        const freePlan = await this.plansService.findByName('Free');
        sub = this.userSubRepository.create({
          userId,
          planId: freePlan.id,
          status: SubscriptionStatus.ACTIVE,
          startDate: new Date(),
          endDate: dayjs().add(1, 'month').toDate(),
        });
        await this.userSubRepository.save(sub);
        sub.plan = freePlan;
      } catch (e: any) {
        this.logger.error(
          `Could not auto-assign free subscription: ${e.message}`,
        );
        throw new NotFoundException(
          'No active subscription found and Free plan is not seeded',
        );
      }
    }

    return sub;
  }

  async getSubscriptionHistory(userId: string): Promise<UserSubscription[]> {
    return this.userSubRepository.find({
      where: { userId },
      relations: { plan: true },
      order: { created_at: 'DESC' },
    });
  }

  async cancelSubscription(userId: string): Promise<UserSubscription> {
    const sub = await this.getCurrentSubscription(userId);
    if (sub.plan.price === 0) {
      throw new BadRequestException('Cannot cancel a free subscription');
    }

    sub.status = SubscriptionStatus.CANCELLED;
    sub.cancelAtPeriodEnd = true;
    sub.canceledAt = new Date();
    await this.userSubRepository.save(sub);

    this.loggerService.log(
      `Canceled subscription for User ${userId}, Subscription ID ${sub.id}`,
      'SubscriptionsService',
      'application',
    );

    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId,
        action: 'SUBSCRIPTION_CANCELLED',
        metadata: {
          subscriptionId: sub.id,
          planName: sub.plan.name,
        },
      }),
    );

    // Send email alert to user
    try {
      await this.mailService.sendMail({
        to: 'user@example.com',
        subject: 'NexaSocial Subscription Canceled',
        text: `Your subscription to ${sub.plan.name} has been canceled. You will continue to have access to premium features until the end of your billing cycle on ${sub.endDate?.toLocaleDateString()}.`,
        template: 'subscription-cancelled',
        context: {
          planName: sub.plan.name,
          endDate: sub.endDate?.toLocaleDateString() || '',
        },
      });
    } catch (e: any) {
      this.logger.error(`Failed to send cancellation email: ${e.message}`);
    }

    return sub;
  }

  async upgradePlan(
    userId: string,
    newPlanId: string,
  ): Promise<UserSubscription> {
    const currentSub = await this.getCurrentSubscription(userId);
    const newPlan = await this.plansService.findOne(newPlanId);

    if (
      newPlan.price <= currentSub.plan.price &&
      currentSub.plan.name !== 'Free'
    ) {
      throw new BadRequestException(
        'New plan price must be higher than current plan for upgrade',
      );
    }

    // In production, Stripe/Razorpay would handle prorated upgrades.
    // For NexaSocial, we directly transition the subscription plan to the new tier.
    const upgradedSub = await this.activateSubscription(
      userId,
      newPlanId,
      'UPGRADE',
    );

    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId,
        action: 'PLAN_UPGRADED',
        metadata: {
          fromPlan: currentSub.plan.name,
          toPlan: newPlan.name,
        },
      }),
    );

    return upgradedSub;
  }

  async downgradePlan(
    userId: string,
    newPlanId: string,
  ): Promise<UserSubscription> {
    const currentSub = await this.getCurrentSubscription(userId);
    const newPlan = await this.plansService.findOne(newPlanId);

    if (newPlan.price >= currentSub.plan.price && newPlan.name !== 'Free') {
      throw new BadRequestException(
        'New plan price must be lower than current plan for downgrade',
      );
    }

    // Perform downgrade activation
    const downgradedSub = await this.activateSubscription(
      userId,
      newPlanId,
      'DOWNGRADE',
    );

    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId,
        action: 'PLAN_DOWNGRADED',
        metadata: {
          fromPlan: currentSub.plan.name,
          toPlan: newPlan.name,
        },
      }),
    );

    return downgradedSub;
  }

  async renewSubscription(userId: string): Promise<UserSubscription> {
    const sub = await this.getCurrentSubscription(userId);

    const now = new Date();
    const newEndDate = dayjs(sub.endDate || now)
      .add(1, 'month')
      .toDate();

    sub.endDate = newEndDate;
    sub.status = SubscriptionStatus.ACTIVE;
    await this.userSubRepository.save(sub);

    this.loggerService.log(
      `Renewed subscription for User ${userId}, Subscription ID ${sub.id}`,
      'SubscriptionsService',
      'application',
    );

    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId,
        action: 'SUBSCRIPTION_RENEWED',
        metadata: {
          subscriptionId: sub.id,
          planName: sub.plan.name,
          newEndDate,
        },
      }),
    );

    return sub;
  }

  async processExpirationJob(): Promise<void> {
    const now = new Date();
    const expiredSubs = await this.userSubRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: LessThan(now),
      },
      relations: { plan: true },
    });

    this.logger.log(
      `Subscription Expiry Job: Found ${expiredSubs.length} expired subscriptions`,
    );

    for (const sub of expiredSubs) {
      sub.status = SubscriptionStatus.EXPIRED;
      await this.userSubRepository.save(sub);

      this.loggerService.log(
        `Subscription expired: ID ${sub.id} for User ${sub.userId}`,
        'SubscriptionsService',
        'application',
      );

      await this.activityLogRepository.save(
        this.activityLogRepository.create({
          userId: sub.userId,
          action: 'SUBSCRIPTION_EXPIRED',
          metadata: {
            subscriptionId: sub.id,
            planName: sub.plan.name,
          },
        }),
      );

      // Send email alert to user
      try {
        await this.mailService.sendMail({
          to: 'user@example.com',
          subject: 'NexaSocial Subscription Expired',
          text: `Your subscription to ${sub.plan.name} has expired. Access to premium features has been restricted. You can subscribe again anytime!`,
          template: 'subscription-expired',
          context: {
            planName: sub.plan.name,
          },
        });
      } catch (e: any) {
        this.logger.error(`Failed to send expiration email: ${e.message}`);
      }
    }
  }
}
