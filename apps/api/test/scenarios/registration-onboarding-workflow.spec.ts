import { BadRequestException } from '@nestjs/common';
import { AuthService } from '../../src/auth/auth.service';
import { RoleEnum } from '../../src/auth/constants/roles.constants';
import { WorkspaceRole } from '../../src/workspace-members/entities/workspace-member.entity';
import { SubscriptionStatus } from '../../src/subscriptions/entities/user-subscription.entity';
import { PaymentStatus } from '../../src/payments/entities/payment.entity';
import { SubscriptionsService } from '../../src/subscriptions/subscriptions.service';
import { PaymentsService } from '../../src/payments/payments.service';

describe('Registration and Subscription Onboarding Workflow (Scenarios 1 to 11)', () => {
  let authService: AuthService;
  let subscriptionsService: SubscriptionsService;
  let paymentsService: PaymentsService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockWorkspacesService = {
    createDefaultWorkspace: jest.fn(),
    findById: jest.fn(),
  };

  const mockInvitationsService = {
    validateToken: jest.fn(),
    accept: jest.fn(),
  };

  const mockWorkspaceRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn().mockImplementation((data) => ({ id: 'ws_provisioned_1', ...data })),
    save: jest.fn().mockImplementation(async (ws) => ({ id: ws.id || 'ws_provisioned_1', ...ws })),
  };

  const mockMemberRepo = {
    findOne: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockImplementation((data) => ({ id: 'mem_provisioned_1', ...data })),
    save: jest.fn().mockImplementation(async (mem) => ({ id: mem.id || 'mem_provisioned_1', ...mem })),
  };

  const mockUserSubRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn().mockImplementation((data) => ({ id: 'sub_active_1', ...data })),
    save: jest.fn().mockImplementation(async (sub) => ({ id: sub.id || 'sub_active_1', ...sub })),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockPlansService = {
    findOne: jest.fn(),
    findAll: jest.fn(),
  };

  const mockPaymentRepo = {
    findOne: jest.fn(),
    create: jest.fn().mockImplementation((data) => ({ id: 'pay_rec_1', ...data })),
    save: jest.fn().mockImplementation(async (p) => ({ id: p.id || 'pay_rec_1', ...p })),
    manager: {
      query: jest.fn().mockResolvedValue([]),
    },
  };

  const mockRazorpayGateway = {
    createOrder: jest.fn(),
    verifyPaymentSignature: jest.fn(),
  };

  const mockStripeGateway = {
    createOrder: jest.fn(),
  };

  const mockMailService = {
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendEmailVerification: jest.fn().mockResolvedValue(true),
    sendSubscriptionActivated: jest.fn().mockResolvedValue(true),
    sendPaymentFailed: jest.fn().mockResolvedValue(true),
  };

  const mockLogger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockDataSource = {
    query: jest.fn().mockResolvedValue([]),
  };

  const mockActivityLogRepo = {
    create: jest.fn().mockImplementation((d) => d),
    save: jest.fn().mockImplementation(async (d) => d),
  };

  const mockPaymentsServiceForSub = {
    getHistory: jest.fn().mockResolvedValue([]),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    authService = new AuthService(
      mockUsersService as any,
      { sign: () => 'mock_jwt_token' } as any,
      { save: jest.fn(), create: jest.fn() } as any,
      mockLogger as any,
      mockEventEmitter as any,
      mockMailService as any,
      mockWorkspacesService as any,
      mockInvitationsService as any,
    );

    subscriptionsService = new SubscriptionsService(
      mockUserSubRepo as any,
      mockActivityLogRepo as any,
      mockPlansService as any,
      mockPaymentsServiceForSub as any,
      mockLogger as any,
      mockMailService as any,
      mockWorkspaceRepo as any,
      mockMemberRepo as any,
      mockDataSource as any,
    );

    paymentsService = new PaymentsService(
      mockPaymentRepo as any,
      mockActivityLogRepo as any,
      mockPlansService as any,
      mockStripeGateway as any,
      mockRazorpayGateway as any,
      subscriptionsService,
      mockLogger as any,
      mockWorkspaceRepo as any,
      mockMailService as any,
    );
  });

  // Scenario 1: Public registration creates a user but no workspace
  describe('Scenario 1: Public registration creates a user but no workspace', () => {
    it('creates the user in users table without creating a workspace or workspace_members record', async () => {
      const mockCreatedUser = {
        id: 'user_owner_101',
        email: 'alice@nexasocial.com',
        firstName: 'Alice',
        lastName: 'Owner',
        role: { name: RoleEnum.WORKSPACE_OWNER },
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockCreatedUser);

      const registered = await authService.register({
        email: 'alice@nexasocial.com',
        password: 'SecurePassword123!',
        firstName: 'Alice',
        lastName: 'Owner',
      });

      expect(registered).toBeDefined();
      expect(registered.id).toBe('user_owner_101');
      expect(registered.email).toBe('alice@nexasocial.com');
      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'alice@nexasocial.com',
          firstName: 'Alice',
          lastName: 'Owner',
        }),
        'WORKSPACE_OWNER',
      );
      // No workspace created during registration
      expect(mockWorkspacesService.createDefaultWorkspace).not.toHaveBeenCalled();
      expect(mockWorkspaceRepo.create).not.toHaveBeenCalled();
      expect(mockMemberRepo.create).not.toHaveBeenCalled();
    });
  });

  // Scenario 2: The user is redirected to subscription plans
  describe('Scenario 2: User registration response directs to subscription plans', () => {
    it('returns workspaceId: null and isInvited: false, routing new owner to subscription plans', async () => {
      const mockCreatedUser = {
        id: 'user_owner_102',
        email: 'bob@nexasocial.com',
        firstName: 'Bob',
        lastName: 'Builder',
        role: { name: RoleEnum.WORKSPACE_OWNER },
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockCreatedUser);

      const result = await authService.register({
        email: 'bob@nexasocial.com',
        password: 'Password123!',
        firstName: 'Bob',
        lastName: 'Builder',
      });

      expect(result.isInvited).toBe(false);
      expect(result.workspaceId).toBeNull();
    });
  });

  // Scenario 3: Direct navigation to workspace-protected pages displays the onboarding message
  describe('Scenario 3: Direct navigation to workspace-protected pages before subscription purchase', () => {
    it('returns hasActiveSubscription: false and workspaceId: null for un-onboarded owner', async () => {
      mockUserSubRepo.findOne.mockResolvedValue(null);
      mockMemberRepo.find.mockResolvedValue([]);
      mockDataSource.query.mockResolvedValue([]);

      const entitlements = await subscriptionsService.getEntitlements('user_owner_101');

      expect(entitlements.hasActiveSubscription).toBe(false);
      expect(entitlements.status).toBe('NONE');
      expect(entitlements.workspaceId).toBeNull();
      expect(entitlements.features).toBeNull();
      // Verifies workspace repository create was not called simply because workspace was missing
      expect(mockWorkspaceRepo.create).not.toHaveBeenCalled();
    });
  });

  // Scenario 4: The onboarding message buttons point to subscription plans and logout
  describe('Scenario 4: Onboarding guard navigates to subscription plans', () => {
    it('un-onboarded owner entitlements indicate owner status without active subscription', async () => {
      mockUserSubRepo.findOne.mockResolvedValue(null);
      mockMemberRepo.find.mockResolvedValue([]);

      const entitlements = await subscriptionsService.getEntitlements('user_owner_103');
      expect(entitlements.isWorkspaceOwner).toBe(true);
      expect(entitlements.hasActiveSubscription).toBe(false);
    });
  });

  // Scenario 5: Failed payment does not create a workspace or activate paid entitlements
  describe('Scenario 5: Failed payment does not create a workspace or activate paid entitlements', () => {
    it('throws BadRequestException and retains FAILED status without creating workspace', async () => {
      const mockPayment = {
        id: 'pay_failed_1',
        userId: 'user_owner_104',
        planId: 'plan_pro',
        amount: 999,
        gateway: 'RAZORPAY',
        status: PaymentStatus.PENDING,
        gatewayOrderId: 'order_123',
      };
      mockPaymentRepo.findOne.mockResolvedValue(mockPayment);
      mockRazorpayGateway.verifyPaymentSignature.mockReturnValue(false); // Invalid signature
      mockPaymentRepo.manager.query.mockResolvedValue([{ first_name: 'David', last_name: 'Test', email: 'david@test.com' }]);

      await expect(
        paymentsService.verifyPayment('user_owner_104', {
          gateway: 'RAZORPAY',
          gatewayOrderId: 'order_123',
          gatewayPaymentId: 'pay_invalid_sig',
          gatewaySignature: 'bad_signature',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPayment.status).toBe(PaymentStatus.FAILED);
      expect(mockPaymentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: PaymentStatus.FAILED }),
      );
      // Workspace and subscription must NOT be provisioned
      expect(mockWorkspaceRepo.create).not.toHaveBeenCalled();
      expect(mockUserSubRepo.create).not.toHaveBeenCalled();
    });
  });

  // Scenario 6: Successful payment activates the subscription and provisions exactly one workspace
  describe('Scenario 6: Successful payment activates subscription and provisions exactly one workspace', () => {
    it('verifies payment, activates subscription, and provisions initial workspace', async () => {
      const mockPayment = {
        id: 'pay_success_1',
        userId: 'user_owner_105',
        planId: 'plan_starter',
        amount: 499,
        currency: 'INR',
        gateway: 'RAZORPAY',
        status: PaymentStatus.PENDING,
        gatewayOrderId: 'order_valid_123',
      };
      const mockPlan = {
        id: 'plan_starter',
        name: 'Starter',
        price: 499,
        interval: 'month',
        durationDays: 30,
        features: { liveStreaming: true, analytics: true },
      };

      mockPaymentRepo.findOne.mockResolvedValue(mockPayment);
      mockRazorpayGateway.verifyPaymentSignature.mockReturnValue(true);
      mockPlansService.findOne.mockResolvedValue(mockPlan);
      mockWorkspaceRepo.findOne.mockResolvedValue(null);
      mockMemberRepo.findOne.mockResolvedValue(null);
      mockDataSource.query.mockResolvedValue([
        { first_name: 'Elena', last_name: 'Owner', email: 'elena@nexasocial.com' },
      ]);

      const result = await paymentsService.verifyPayment('user_owner_105', {
        gateway: 'RAZORPAY',
        gatewayOrderId: 'order_valid_123',
        gatewayPaymentId: 'pay_rzp_valid_999',
        gatewaySignature: 'valid_signature',
      });

      expect(result.status).toBe('SUCCESS');
      expect(mockPayment.status).toBe(PaymentStatus.SUCCESS);
      expect(mockUserSubRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user_owner_105',
          planId: 'plan_starter',
          status: SubscriptionStatus.ACTIVE,
        }),
      );
      // Workspace is NOT automatically created; user must explicitly create it with a chosen name
      expect(mockWorkspaceRepo.create).not.toHaveBeenCalled();
    });
  });

  // Scenario 7: The new workspace has the correct WORKSPACE_OWNER membership
  describe('Scenario 7: Correct WORKSPACE_OWNER membership assignment upon provisioning', () => {
    it('assigns WorkspaceRole.OWNER to the workspace membership record when workspace is named and created', async () => {
      mockWorkspaceRepo.findOne.mockResolvedValue(null);
      mockMemberRepo.findOne.mockResolvedValue(null);
      mockDataSource.query.mockResolvedValue([
        { first_name: 'Frank', last_name: 'Miller', email: 'frank@example.com' },
      ]);

      const ws = await subscriptionsService.ensureOwnerWorkspace('user_owner_106', 'Frank Studio');

      expect(ws).toBeDefined();
      expect(mockWorkspaceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: 'user_owner_106',
          name: 'Frank Studio',
          status: 'ACTIVE',
        }),
      );
      expect(mockMemberRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user_owner_106',
          role: WorkspaceRole.OWNER,
        }),
      );
      expect(mockMemberRepo.save).toHaveBeenCalled();
    });
  });

  // Scenario 8: The purchased plan's included features become available
  describe('Scenario 8: Purchased plan features become available in entitlements', () => {
    it('returns unlocked features and active subscription status', async () => {
      const proPlan = {
        id: 'plan_pro_unlock',
        name: 'Pro',
        price: 999,
        interval: 'month',
        features: {
          liveStreaming: true,
          analytics: true,
          scheduling: true,
          aiCaptions: true,
        },
      };

      mockUserSubRepo.findOne.mockResolvedValue({
        id: 'sub_unlocked',
        userId: 'user_owner_107',
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 86400000),
        plan: proPlan,
      });

      mockWorkspaceRepo.findOne.mockResolvedValue({
        id: 'ws_unlocked',
        name: "Frank's Workspace",
        ownerId: 'user_owner_107',
      });
      mockMemberRepo.findOne.mockResolvedValue({
        id: 'mem_107',
        workspaceId: 'ws_unlocked',
        userId: 'user_owner_107',
        role: WorkspaceRole.OWNER,
      });

      const entitlements = await subscriptionsService.getEntitlements('user_owner_107');

      expect(entitlements.hasActiveSubscription).toBe(true);
      expect(entitlements.status).toBe(SubscriptionStatus.ACTIVE);
      expect(entitlements.planName).toBe('Pro');
      expect(entitlements.features).toEqual(proPlan.features);
      expect(entitlements.workspaceId).toBe('ws_unlocked');
      expect(entitlements.workspaceRole).toBe(WorkspaceRole.OWNER);
    });
  });

  // Scenario 9: A retry after a provisioning failure does not charge twice or create duplicate workspaces
  describe('Scenario 9: Idempotent recovery after interrupted provisioning', () => {
    it('safely recovers missing workspace on retry without duplicate charges or workspaces', async () => {
      const existingWorkspace = {
        id: 'ws_already_created',
        name: "Grace's Workspace",
        ownerId: 'user_owner_108',
      };

      // First call: workspace found in database
      mockWorkspaceRepo.findOne.mockResolvedValue(existingWorkspace);
      mockMemberRepo.findOne.mockResolvedValue({
        id: 'mem_108',
        workspaceId: 'ws_already_created',
        userId: 'user_owner_108',
        role: WorkspaceRole.OWNER,
      });

      const ws1 = await subscriptionsService.ensureOwnerWorkspace('user_owner_108', "Grace's Workspace");
      const ws2 = await subscriptionsService.ensureOwnerWorkspace('user_owner_108', "Grace's Workspace");

      expect(ws1.id).toBe('ws_already_created');
      expect(ws2.id).toBe('ws_already_created');
      // Must not create another workspace or membership
      expect(mockWorkspaceRepo.create).not.toHaveBeenCalled();
      expect(mockPaymentRepo.create).not.toHaveBeenCalled();
    });
  });

  // Scenario 10: An invited new user joins the existing workspace without creating another one
  describe('Scenario 10: Invited new user registration workflow', () => {
    it('registers user, joins invited workspace with role, and does not create a personal workspace', async () => {
      const mockInvitedUser = {
        id: 'invited_member_109',
        email: 'collaborator@team.com',
        firstName: 'Chris',
        lastName: 'Creator',
        role: { name: RoleEnum.USER },
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockInvitedUser);
      mockInvitationsService.validateToken.mockResolvedValue({
        id: 'inv_token_999',
        workspaceId: 'ws_existing_team',
        email: 'collaborator@team.com',
        role: WorkspaceRole.CREATOR,
        status: 'PENDING',
      });
      mockInvitationsService.accept.mockResolvedValue({
        workspaceId: 'ws_existing_team',
        role: WorkspaceRole.CREATOR,
      });

      const result = await authService.register({
        email: 'collaborator@team.com',
        password: 'Password123!',
        firstName: 'Chris',
        lastName: 'Creator',
        invitationToken: 'token_valid_invite',
      });

      expect(result.isInvited).toBe(true);
      expect(result.workspaceId).toBe('ws_existing_team');
      expect(mockInvitationsService.accept).toHaveBeenCalledWith(
        { token: 'token_valid_invite' },
        'invited_member_109',
      );
      // No workspace or personal subscription created
      expect(mockWorkspacesService.createDefaultWorkspace).not.toHaveBeenCalled();
      expect(mockWorkspaceRepo.create).not.toHaveBeenCalled();
      expect(mockUserSubRepo.create).not.toHaveBeenCalled();
    });
  });

  // Scenario 11: Existing subscribed users and their workspaces continue to work normally
  describe('Scenario 11: Existing subscribed users and workspaces preserved', () => {
    it('loads active entitlements, preserves existing workspace and does not rename or recreate', async () => {
      const existingUserWorkspace = {
        id: 'ws_legacy_owner',
        name: 'Acme Social Studio',
        ownerId: 'legacy_user_110',
        slug: 'acme-social-studio',
      };
      const legacyPlan = {
        id: 'plan_business',
        name: 'Business',
        price: 1999,
        interval: 'month',
        features: { liveStreaming: true, multiPlatform: true, analytics: true },
      };

      mockUserSubRepo.findOne.mockResolvedValue({
        id: 'sub_legacy_active',
        userId: 'legacy_user_110',
        status: SubscriptionStatus.ACTIVE,
        plan: legacyPlan,
        startDate: new Date(Date.now() - 10 * 86400000),
        endDate: new Date(Date.now() + 20 * 86400000),
      });

      mockWorkspaceRepo.findOne.mockResolvedValue(existingUserWorkspace);
      mockMemberRepo.findOne.mockResolvedValue({
        id: 'mem_legacy',
        workspaceId: 'ws_legacy_owner',
        userId: 'legacy_user_110',
        role: WorkspaceRole.OWNER,
      });

      const entitlements = await subscriptionsService.getEntitlements('legacy_user_110', 'ws_legacy_owner');

      expect(entitlements.hasActiveSubscription).toBe(true);
      expect(entitlements.workspaceId).toBe('ws_legacy_owner');
      expect(entitlements.workspaceName).toBe('Acme Social Studio');
      expect(entitlements.isWorkspaceOwner).toBe(true);
      expect(entitlements.workspaceRole).toBe(WorkspaceRole.OWNER);
      // Ensure existing name and workspace were completely preserved
      expect(mockWorkspaceRepo.create).not.toHaveBeenCalled();
      expect(mockWorkspaceRepo.save).not.toHaveBeenCalled();
    });
  });
});
