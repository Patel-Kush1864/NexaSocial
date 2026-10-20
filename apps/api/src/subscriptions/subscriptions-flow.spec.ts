import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as crypto from 'crypto';
import dayjs from 'dayjs';

import { SubscriptionsService } from './subscriptions.service';
import {
  UserSubscription,
  SubscriptionStatus,
} from './entities/user-subscription.entity';
import { SubscriptionGuard } from './guards/subscription.guard';
import { PlansService } from '../plans/plans.service';
import { PaymentsService } from '../payments/payments.service';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { ActivityLog } from '../users/entities/activity-log.entity';
import { LoggerServiceWrapper } from '../logger/logger.service';
import { MailService } from '../mail/mail.service';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { RazorpayGateway } from '../payments/gateways/razorpay.gateway';
import { StripeGateway } from '../payments/gateways/stripe.gateway';
import { ConfigService } from '@nestjs/config';

describe('Phase 10: Subscription-First Flow & Razorpay Integration Tests', () => {
  let subscriptionsService: SubscriptionsService;
  let subscriptionGuard: SubscriptionGuard;
  let paymentsService: PaymentsService;
  let razorpayGateway: RazorpayGateway;

  const mockUserSubRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((dto) => ({ id: 'sub_123', ...dto })),
    save: jest.fn((sub) => Promise.resolve(sub)),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockPaymentRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((dto) => ({ id: 'pay_123', ...dto })),
    save: jest.fn((pay) => Promise.resolve(pay)),
  };

  const mockActivityLogRepo = {
    create: jest.fn((dto) => dto),
    save: jest.fn().mockResolvedValue(true),
  };

  const mockWorkspaceRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockPlansService = {
    findOne: jest.fn(),
    findByName: jest.fn(),
    findAll: jest.fn(),
  };

  const mockPaymentsService = {
    getHistory: jest.fn(),
    createOrder: jest.fn(),
    verifyPayment: jest.fn(),
  };

  const mockMailService = {
    sendMail: jest.fn().mockResolvedValue(true),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'RAZORPAY_KEY_ID') return 'rzp_test_sample_id';
      if (key === 'RAZORPAY_KEY_SECRET') return 'sample_key_secret_123';
      if (key === 'RAZORPAY_WEBHOOK_SECRET') return 'sample_webhook_secret_123';
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        SubscriptionGuard,
        PaymentsService,
        RazorpayGateway,
        StripeGateway,
        Reflector,
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: getRepositoryToken(UserSubscription),
          useValue: mockUserSubRepo,
        },
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepo },
        {
          provide: getRepositoryToken(ActivityLog),
          useValue: mockActivityLogRepo,
        },
        { provide: getRepositoryToken(Workspace), useValue: mockWorkspaceRepo },
        { provide: PlansService, useValue: mockPlansService },
        { provide: PaymentsService, useValue: mockPaymentsService },
        { provide: MailService, useValue: mockMailService },
        { provide: LoggerServiceWrapper, useValue: mockLoggerService },
      ],
    }).compile();

    subscriptionsService =
      module.get<SubscriptionsService>(SubscriptionsService);
    subscriptionGuard = module.get<SubscriptionGuard>(SubscriptionGuard);
    paymentsService = module.get<PaymentsService>(PaymentsService);
    razorpayGateway = module.get<RazorpayGateway>(RazorpayGateway);
  });

  describe('1. Subscription Entitlements & Locked States', () => {
    it('New user without subscription returns hasActiveSubscription: false, status: NONE', async () => {
      mockUserSubRepo.findOne.mockResolvedValue(null);
      mockPaymentsService.getHistory.mockResolvedValue([]);

      const entitlements =
        await subscriptionsService.getEntitlements('new_user_1');

      expect(entitlements.hasActiveSubscription).toBe(false);
      expect(entitlements.status).toBe('NONE');
      expect(entitlements.features).toBeNull();
      expect(entitlements.planId).toBeNull();
    });

    it('Existing user with active subscription returns hasActiveSubscription: true and features', async () => {
      const activePlan = {
        id: 'plan_starter',
        name: 'Starter',
        price: 499,
        interval: 'month',
        features: {
          workspaces: 2,
          socialAccounts: 5,
          liveStreaming: true,
          analytics: true,
          aiFeatures: false,
        },
      };

      mockUserSubRepo.findOne.mockResolvedValue({
        id: 'sub_active',
        userId: 'active_user',
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: dayjs().add(20, 'day').toDate(),
        plan: activePlan,
      });
      mockPaymentsService.getHistory.mockResolvedValue([]);

      const entitlements =
        await subscriptionsService.getEntitlements('active_user');

      expect(entitlements.hasActiveSubscription).toBe(true);
      expect(entitlements.status).toBe(SubscriptionStatus.ACTIVE);
      expect(entitlements.planName).toBe('Starter');
      expect(entitlements.planPrice).toBe(499);
      expect(entitlements.features.liveStreaming).toBe(true);
    });

    it('Cancelled subscription still retains access until paid-through endDate', async () => {
      const activePlan = {
        id: 'plan_pro',
        name: 'Professional',
        price: 999,
        interval: 'month',
        features: { liveStreaming: true },
      };

      mockUserSubRepo.findOne.mockResolvedValue({
        id: 'sub_cancelling',
        userId: 'user_cancel',
        status: SubscriptionStatus.CANCELLED,
        startDate: dayjs().subtract(10, 'day').toDate(),
        endDate: dayjs().add(20, 'day').toDate(), // still in future
        cancelAtPeriodEnd: true,
        plan: activePlan,
      });
      mockPaymentsService.getHistory.mockResolvedValue([]);

      const entitlements =
        await subscriptionsService.getEntitlements('user_cancel');

      expect(entitlements.hasActiveSubscription).toBe(true);
      expect(entitlements.status).toBe(SubscriptionStatus.CANCELLED);
      expect(entitlements.planName).toBe('Professional');
    });

    it('Expired subscription loses access and updates status to EXPIRED', async () => {
      mockUserSubRepo.findOne
        .mockResolvedValueOnce({
          id: 'sub_old',
          userId: 'expired_user',
          status: SubscriptionStatus.ACTIVE,
          startDate: dayjs().subtract(40, 'day').toDate(),
          endDate: dayjs().subtract(5, 'day').toDate(), // expired
          plan: { name: 'Starter', price: 499 },
        })
        .mockResolvedValueOnce({
          status: SubscriptionStatus.EXPIRED,
        });
      mockPaymentsService.getHistory.mockResolvedValue([]);

      const entitlements =
        await subscriptionsService.getEntitlements('expired_user');

      expect(entitlements.hasActiveSubscription).toBe(false);
      expect(entitlements.status).toBe(SubscriptionStatus.EXPIRED);
    });

    it('Pending or Failed payment sets status correctly and keeps features locked', async () => {
      mockUserSubRepo.findOne.mockResolvedValue(null);
      mockPaymentsService.getHistory.mockResolvedValue([
        {
          id: 'pay_fail',
          status: 'FAILED',
          amount: 499,
          currency: 'INR',
          gateway: 'RAZORPAY',
        },
      ]);

      const entitlements = await subscriptionsService.getEntitlements(
        'user_failed_payment',
      );

      expect(entitlements.hasActiveSubscription).toBe(false);
      expect(entitlements.status).toBe('FAILED');
      expect(entitlements.latestPayment?.status).toBe('FAILED');
    });
  });

  describe('2. SubscriptionGuard Route Protection', () => {
    it('Platform admins (SUPER_ADMIN / ADMIN) bypass customer subscription checks', async () => {
      const mockExecutionContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              id: 'admin_1',
              role: 'SUPER_ADMIN',
              email: 'admin@nexasocial.local',
            },
          }),
        }),
      } as any;

      const allowed = await subscriptionGuard.canActivate(mockExecutionContext);
      expect(allowed).toBe(true);
    });

    it('Denies access with 403 SUBSCRIPTION_REQUIRED when non-subscriber accesses protected route', async () => {
      mockUserSubRepo.findOne.mockResolvedValue(null);
      mockPaymentsService.getHistory.mockResolvedValue([]);

      const mockExecutionContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              id: 'normal_user',
              role: 'USER',
              email: 'user@example.com',
            },
          }),
        }),
      } as any;

      await expect(
        subscriptionGuard.canActivate(mockExecutionContext),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('3. Razorpay Signature Verification & Trusted Prices', () => {
    const keySecret = 'sample_key_secret_123';

    it('Valid Razorpay Standard Checkout HMAC signature is verified successfully', () => {
      const orderId = 'order_valid_12345';
      const paymentId = 'pay_razorpay_999';
      const payload = `${orderId}|${paymentId}`;
      const validSignature = crypto
        .createHmac('sha256', keySecret)
        .update(payload)
        .digest('hex');

      const isVerified = razorpayGateway.verifyPaymentSignature(
        orderId,
        paymentId,
        validSignature,
      );

      expect(isVerified).toBe(true);
    });

    it('Tampered or invalid Razorpay signature is rejected', () => {
      const isVerified = razorpayGateway.verifyPaymentSignature(
        'order_valid_12345',
        'pay_razorpay_999',
        'invalid_tampered_signature_hex',
      );

      expect(isVerified).toBe(false);
    });

    it('Mismatched order ID signature is rejected', () => {
      const validSignatureForOrder1 = crypto
        .createHmac('sha256', keySecret)
        .update('order_1|pay_999')
        .digest('hex');

      const isVerified = razorpayGateway.verifyPaymentSignature(
        'order_DIFFERENT',
        'pay_999',
        validSignatureForOrder1,
      );

      expect(isVerified).toBe(false);
    });
  });
});
