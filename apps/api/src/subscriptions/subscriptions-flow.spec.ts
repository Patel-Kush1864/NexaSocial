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
import { DataSource } from 'typeorm';
import {
  WorkspaceMember,
  WorkspaceRole,
} from '../workspace-members/entities/workspace-member.entity';

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
    create: jest.fn((dto) => ({ id: 'ws_auto_1', ...dto })),
    save: jest.fn((ws) => Promise.resolve(ws)),
  };

  const mockWorkspaceMemberRepo = {
    findOne: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    create: jest.fn((dto) => dto),
    save: jest.fn((member) => Promise.resolve(member)),
  };

  const mockDataSource = {
    query: jest
      .fn()
      .mockResolvedValue([
        { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
      ]),
    createQueryRunner: jest.fn(() => ({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
        findOne: jest.fn(),
      },
    })),
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
    sendSubscriptionActivated: jest.fn().mockResolvedValue(true),
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
        { provide: DataSource, useValue: mockDataSource },
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
        {
          provide: getRepositoryToken(WorkspaceMember),
          useValue: mockWorkspaceMemberRepo,
        },
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
      expect(entitlements.features?.liveStreaming).toBe(true);
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
            headers: {},
            query: {},
            params: {},
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

  describe('4. Workspace Subscription & Team Member Inheritance (Scenarios A through H)', () => {
    it('Scenario A: Team member (CREATOR) accesses workspace with ACTIVE subscription without purchasing plan', async () => {
      // Workspace owned by 'owner_1'
      mockWorkspaceRepo.findOne.mockResolvedValue({
        id: 'ws_alpha',
        name: 'Alpha Workspace',
        ownerId: 'owner_1',
      });
      // Team member has role CREATOR in ws_alpha
      mockWorkspaceMemberRepo.findOne.mockResolvedValue({
        id: 'member_1',
        workspaceId: 'ws_alpha',
        userId: 'creator_1',
        role: WorkspaceRole.CREATOR,
      });
      // Owner has an ACTIVE subscription
      const ownerPlan = {
        id: 'plan_pro',
        name: 'Pro',
        price: 999,
        interval: 'month',
        features: {
          workspaces: 5,
          socialAccounts: 10,
          liveStreaming: true,
          analytics: true,
        },
      };
      mockUserSubRepo.findOne.mockResolvedValue({
        id: 'sub_owner_active',
        userId: 'owner_1',
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: dayjs().add(30, 'day').toDate(),
        plan: ownerPlan,
      });
      mockPaymentsService.getHistory.mockResolvedValue([]);

      const entitlements = await subscriptionsService.getEntitlements(
        'creator_1',
        'ws_alpha',
      );

      expect(entitlements.hasActiveSubscription).toBe(true);
      expect(entitlements.status).toBe(SubscriptionStatus.ACTIVE);
      expect(entitlements.isWorkspaceOwner).toBe(false);
      expect(entitlements.workspaceRole).toBe(WorkspaceRole.CREATOR);
      expect(entitlements.workspaceId).toBe('ws_alpha');
      expect(entitlements.features?.liveStreaming).toBe(true);

      // SubscriptionGuard allows team member access
      const mockExecutionContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'creator_1', role: 'USER' },
            headers: { 'x-workspace-id': 'ws_alpha' },
          }),
        }),
      } as any;

      const allowed = await subscriptionGuard.canActivate(mockExecutionContext);
      expect(allowed).toBe(true);
    });

    it('Scenario E: Team member accesses workspace without valid subscription -> received non-owner status and guidance', async () => {
      mockWorkspaceRepo.findOne.mockResolvedValue({
        id: 'ws_unsubscribed',
        name: 'Unsubscribed Workspace',
        ownerId: 'owner_no_sub',
      });
      mockWorkspaceMemberRepo.findOne.mockResolvedValue({
        id: 'member_2',
        workspaceId: 'ws_unsubscribed',
        userId: 'viewer_1',
        role: WorkspaceRole.VIEWER,
      });
      // Owner has no subscription
      mockUserSubRepo.findOne.mockResolvedValue(null);
      mockPaymentsService.getHistory.mockResolvedValue([]);

      const entitlements = await subscriptionsService.getEntitlements(
        'viewer_1',
        'ws_unsubscribed',
      );

      expect(entitlements.hasActiveSubscription).toBe(false);
      expect(entitlements.status).toBe('NONE');
      expect(entitlements.isWorkspaceOwner).toBe(false);

      // SubscriptionGuard rejects with non-owner message
      const mockExecutionContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'viewer_1', role: 'USER' },
            headers: { 'x-workspace-id': 'ws_unsubscribed' },
          }),
        }),
      } as any;

      await expect(
        subscriptionGuard.canActivate(mockExecutionContext),
      ).rejects.toThrow(
        'This workspace does not currently have an active subscription. Please contact the workspace owner.',
      );
    });

    it('Scenario F: User switches between workspaces with different subscription statuses', async () => {
      mockWorkspaceMemberRepo.findOne.mockImplementation(({ where }) => {
        if (where.workspaceId === 'ws_active_1') {
          return Promise.resolve({
            id: 'm1',
            workspaceId: 'ws_active_1',
            userId: 'multi_user',
            role: WorkspaceRole.MANAGER,
          });
        }
        if (where.workspaceId === 'ws_expired_2') {
          return Promise.resolve({
            id: 'm2',
            workspaceId: 'ws_expired_2',
            userId: 'multi_user',
            role: WorkspaceRole.CREATOR,
          });
        }
        return Promise.resolve(null);
      });

      mockWorkspaceRepo.findOne.mockImplementation(({ where }) => {
        if (where.id === 'ws_active_1') {
          return Promise.resolve({
            id: 'ws_active_1',
            ownerId: 'owner_active',
            name: 'Active WS',
          });
        }
        if (where.id === 'ws_expired_2') {
          return Promise.resolve({
            id: 'ws_expired_2',
            ownerId: 'owner_expired',
            name: 'Expired WS',
          });
        }
        return Promise.resolve(null);
      });

      mockUserSubRepo.findOne.mockImplementation(({ where }) => {
        const targetUserId = Array.isArray(where)
          ? where[0]?.userId
          : where?.userId;
        if (targetUserId === 'owner_active') {
          return Promise.resolve({
            id: 'sub_active',
            userId: 'owner_active',
            status: SubscriptionStatus.ACTIVE,
            endDate: dayjs().add(20, 'day').toDate(),
            plan: {
              name: 'Starter',
              price: 499,
              features: { liveStreaming: true },
            },
          });
        }
        if (targetUserId === 'owner_expired') {
          return Promise.resolve({
            id: 'sub_expired',
            userId: 'owner_expired',
            status: SubscriptionStatus.EXPIRED,
            endDate: dayjs().subtract(5, 'day').toDate(),
            plan: { name: 'Starter', price: 499 },
          });
        }
        return Promise.resolve(null);
      });
      mockPaymentsService.getHistory.mockResolvedValue([]);

      // Accessing active workspace
      const activeEntitlements = await subscriptionsService.getEntitlements(
        'multi_user',
        'ws_active_1',
      );
      expect(activeEntitlements.hasActiveSubscription).toBe(true);
      expect(activeEntitlements.workspaceId).toBe('ws_active_1');

      // Accessing expired workspace
      const expiredEntitlements = await subscriptionsService.getEntitlements(
        'multi_user',
        'ws_expired_2',
      );
      expect(expiredEntitlements.hasActiveSubscription).toBe(false);
      expect(expiredEntitlements.workspaceId).toBe('ws_expired_2');
    });

    it('Scenario G: Unauthorized user not a member of the workspace is denied access', async () => {
      mockWorkspaceRepo.findOne.mockResolvedValue({
        id: 'ws_private',
        name: 'Private WS',
        ownerId: 'owner_secret',
      });
      // User is not a member
      mockWorkspaceMemberRepo.findOne.mockResolvedValue(null);

      await expect(
        subscriptionsService.getEntitlements('intruder_user', 'ws_private'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('5. Complete Onboarding Sequence: Activation, Workspace Provisioning & Idempotent Recovery', () => {
    it('provisions owner workspace and assigns WORKSPACE_OWNER role upon explicit ensureOwnerWorkspace call with name', async () => {
      mockWorkspaceRepo.findOne.mockResolvedValue(null);
      mockWorkspaceMemberRepo.findOne.mockResolvedValue(null);

      const workspace =
        await subscriptionsService.ensureOwnerWorkspace('new_paying_user', 'My Brand Studio');

      expect(workspace).toBeDefined();
      expect(mockWorkspaceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: 'new_paying_user',
          name: 'My Brand Studio',
          status: 'ACTIVE',
        }),
      );
      expect(mockWorkspaceMemberRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'new_paying_user',
          role: WorkspaceRole.OWNER,
        }),
      );
      expect(mockWorkspaceMemberRepo.save).toHaveBeenCalled();
    });

    it('idempotency: does not duplicate workspace or membership if ensureOwnerWorkspace is called multiple times', async () => {
      const existingWorkspace = {
        id: 'ws_existing_123',
        name: "John's Workspace",
        ownerId: 'repeat_user',
        slug: 'johns-workspace-123',
      };
      mockWorkspaceRepo.findOne.mockResolvedValue(existingWorkspace);
      mockWorkspaceMemberRepo.findOne.mockResolvedValue({
        id: 'mem_1',
        workspaceId: 'ws_existing_123',
        userId: 'repeat_user',
        role: WorkspaceRole.OWNER,
      });

      const ws1 =
        await subscriptionsService.ensureOwnerWorkspace('repeat_user', "John's Workspace");
      const ws2 =
        await subscriptionsService.ensureOwnerWorkspace('repeat_user', "John's Workspace");

      expect(ws1.id).toBe('ws_existing_123');
      expect(ws2.id).toBe('ws_existing_123');
      expect(mockWorkspaceRepo.create).not.toHaveBeenCalled();
    });

    it('activateSubscription activates subscription without automatically creating a workspace', async () => {
      const testPlan = {
        id: 'plan_starter',
        name: 'Starter',
        price: 499,
        interval: 'month',
        durationDays: 30,
        features: { liveStreaming: true },
      };
      mockPlansService.findOne.mockResolvedValue(testPlan);
      mockUserSubRepo.findOne.mockResolvedValue(null);
      mockWorkspaceRepo.findOne.mockResolvedValue(null);
      mockWorkspaceMemberRepo.findOne.mockResolvedValue(null);

      const sub = await subscriptionsService.activateSubscription(
        'pay_user_abc',
        'plan_starter',
        'RAZORPAY',
        'pay_999999',
      );

      expect(sub.status).toBe(SubscriptionStatus.ACTIVE);
      // Workspace must NOT be created automatically
      expect(mockWorkspaceRepo.create).not.toHaveBeenCalled();
    });

    it('getEntitlements returns active subscription status without auto-creating workspace', async () => {
      const paidPlan = {
        id: 'plan_pro',
        name: 'Pro',
        price: 999,
        interval: 'month',
        features: { liveStreaming: true, analytics: true },
      };

      // User has active sub in DB, but has not yet created a workspace
      mockUserSubRepo.findOne.mockResolvedValue({
        id: 'sub_paid',
        userId: 'interrupted_user',
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: dayjs().add(30, 'day').toDate(),
        plan: paidPlan,
      });
      mockWorkspaceRepo.findOne.mockResolvedValue(null);
      mockWorkspaceMemberRepo.findOne.mockResolvedValue(null);
      mockPaymentsService.getHistory.mockResolvedValue([]);

      const entitlements =
        await subscriptionsService.getEntitlements('interrupted_user');

      expect(entitlements.hasActiveSubscription).toBe(true);
      expect(entitlements.status).toBe(SubscriptionStatus.ACTIVE);
      expect(entitlements.isWorkspaceOwner).toBe(true);
      expect(entitlements.workspaceRole).toBe(WorkspaceRole.OWNER);
      // No workspace auto-creation
      expect(mockWorkspaceRepo.create).not.toHaveBeenCalled();
    });
  });
});
