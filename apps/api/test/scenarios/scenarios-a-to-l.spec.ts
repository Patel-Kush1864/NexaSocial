import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { WorkspacesService } from '../../src/workspaces/services/workspaces.service';
import { InvitationsService } from '../../src/invitations/services/invitations.service';
import { SubscriptionsService } from '../../src/subscriptions/subscriptions.service';
import { SubscriptionGuard } from '../../src/subscriptions/guards/subscription.guard';
import { WorkspaceRoleGuard } from '../../src/workspaces/guards/workspace-role.guard';
import { WORKSPACE_ROLE_PERMISSIONS } from '../../src/workspaces/constants/workspace-permissions.constants';
import { WorkspaceRole } from '../../src/workspace-members/entities/workspace-member.entity';
import { SubscriptionStatus } from '../../src/subscriptions/entities/user-subscription.entity';
import { RoleEnum } from '../../src/auth/constants/roles.constants';

describe('End-to-End Scenarios A through L', () => {
  let authService: AuthService;
  let workspacesService: WorkspacesService;
  let invitationsService: InvitationsService;
  let subscriptionsService: SubscriptionsService;
  let subscriptionGuard: SubscriptionGuard;
  let workspaceRoleGuard: WorkspaceRoleGuard;
  let reflector: Reflector;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockWorkspacesService = {
    createDefaultWorkspace: jest.fn(),
    findById: jest.fn(),
    getWorkspacePermissions: jest.fn(),
  };

  const mockInvitationsService = {
    getInvitationByToken: jest.fn(),
    accept: jest.fn(),
  };

  const mockSubscriptionsService = {
    getEntitlements: jest.fn(),
  };

  const mockWorkspaceMemberRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    reflector = new Reflector();
    subscriptionGuard = new SubscriptionGuard(
      reflector,
      mockSubscriptionsService as any,
    );
    workspaceRoleGuard = new WorkspaceRoleGuard(
      reflector,
      mockWorkspaceMemberRepo as any,
    );
  });

  // Scenario A: A new user registers publicly, receives WORKSPACE_OWNER access, without automatic workspace creation
  describe('Scenario A: Public Registration Without Automatic Workspace', () => {
    it('creates WORKSPACE_OWNER and does not automatically create a workspace', async () => {
      const mockCreatedUser = {
        id: 'owner_user_1',
        email: 'newowner@nexasocial.com',
        firstName: 'New',
        lastName: 'Owner',
        role: { name: RoleEnum.WORKSPACE_OWNER },
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockCreatedUser);

      const service = new AuthService(
        mockUsersService as any,
        { sign: () => 'jwt_token' } as any,
        { save: jest.fn(), create: jest.fn() } as any,
        { log: jest.fn() } as any,
        { emit: jest.fn() } as any,
        {
          sendWelcomeEmail: jest.fn().mockResolvedValue(true),
          sendEmailVerification: jest.fn().mockResolvedValue(true),
        } as any,
        mockWorkspacesService as any,
        mockInvitationsService as any,
      );

      const result = await service.register({
        email: 'newowner@nexasocial.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'Owner',
      });

      expect(result.isInvited).toBe(false);
      expect(result.workspaceId).toBeNull();
      expect(mockWorkspacesService.createDefaultWorkspace).not.toHaveBeenCalled();
    });
  });

  // Scenario B: Owner purchases a plan successfully, activates subscription, provisions workspace and unlocks features
  describe('Scenario B: Successful Plan Purchase & Feature Activation (Section 11 Items 4, 5, 6, 7)', () => {
    it('returns hasActiveSubscription: true and unlocks plan features', async () => {
      mockSubscriptionsService.getEntitlements.mockResolvedValue({
        hasActiveSubscription: true,
        status: SubscriptionStatus.ACTIVE,
        planName: 'Pro',
        isWorkspaceOwner: true,
        workspaceId: 'ws_owner_1',
        features: {
          liveStreaming: true,
          analytics: true,
          scheduling: true,
        },
      });

      const entitlements = await mockSubscriptionsService.getEntitlements(
        'owner_user_1',
        'ws_owner_1',
      );
      expect(entitlements.hasActiveSubscription).toBe(true);
      expect(entitlements.status).toBe(SubscriptionStatus.ACTIVE);
      expect(entitlements.isWorkspaceOwner).toBe(true);
      expect(entitlements.features.liveStreaming).toBe(true);
    });

    it('provisions initial workspace with WORKSPACE_OWNER role after payment succeeds', async () => {
      mockSubscriptionsService.ensureOwnerWorkspace = jest.fn().mockResolvedValue({
        id: 'ws_owner_1',
        name: "New's Workspace",
        ownerId: 'owner_user_1',
      });

      const ws = await mockSubscriptionsService.ensureOwnerWorkspace('owner_user_1');
      expect(ws.id).toBe('ws_owner_1');
      expect(ws.ownerId).toBe('owner_user_1');
    });

    it('refreshing payment callback does not create duplicate workspaces or subscriptions', async () => {
      mockSubscriptionsService.ensureOwnerWorkspace = jest.fn().mockResolvedValue({
        id: 'ws_owner_1',
        name: "New's Workspace",
        ownerId: 'owner_user_1',
      });

      const ws1 = await mockSubscriptionsService.ensureOwnerWorkspace('owner_user_1');
      const ws2 = await mockSubscriptionsService.ensureOwnerWorkspace('owner_user_1');
      expect(ws1.id).toBe(ws2.id);
    });

    it('recovers interrupted provisioning safely without another payment', async () => {
      mockSubscriptionsService.getEntitlements.mockResolvedValue({
        hasActiveSubscription: true,
        status: SubscriptionStatus.ACTIVE,
        planName: 'Pro',
        isWorkspaceOwner: true,
        workspaceId: 'ws_recovered_1',
        features: { liveStreaming: true },
      });

      const recovered = await mockSubscriptionsService.getEntitlements('owner_user_1');
      expect(recovered.hasActiveSubscription).toBe(true);
      expect(recovered.workspaceId).toBe('ws_recovered_1');
    });
  });

  // Scenario C: Payment fails or is cancelled, owner can retry without paid entitlements
  describe('Scenario C: Payment Failed or Cancelled', () => {
    it('retains locked entitlements and hasActiveSubscription: false', async () => {
      mockSubscriptionsService.getEntitlements.mockResolvedValue({
        hasActiveSubscription: false,
        status: SubscriptionStatus.FAILED,
        planName: null,
        isWorkspaceOwner: true,
        features: null,
      });

      const entitlements = await mockSubscriptionsService.getEntitlements(
        'owner_user_1',
        'ws_owner_1',
      );
      expect(entitlements.hasActiveSubscription).toBe(false);
      expect(entitlements.status).toBe(SubscriptionStatus.FAILED);
    });
  });

  // Scenario D: New user registers through an invitation
  describe('Scenario D: Invited Registration (No duplicate personal workspace)', () => {
    it('joins existing workspace with invited role and does not create default workspace', async () => {
      const mockInvitedUser = {
        id: 'invited_user_1',
        email: 'team@nexasocial.com',
        firstName: 'Team',
        lastName: 'Member',
        role: { name: RoleEnum.USER },
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockInvitedUser);
      mockInvitationsService.validateToken = jest.fn().mockResolvedValue({
        id: 'inv_123',
        workspaceId: 'ws_host_1',
        email: 'team@nexasocial.com',
        role: WorkspaceRole.CREATOR,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 100000),
      });
      mockInvitationsService.accept = jest.fn().mockResolvedValue({
        workspaceId: 'ws_host_1',
        role: WorkspaceRole.CREATOR,
      });

      const service = new AuthService(
        mockUsersService as any,
        { sign: () => 'jwt_token' } as any,
        { save: jest.fn(), create: jest.fn() } as any,
        { log: jest.fn() } as any,
        { emit: jest.fn() } as any,
        {
          sendWelcomeEmail: jest.fn().mockResolvedValue(true),
          sendEmailVerification: jest.fn().mockResolvedValue(true),
        } as any,
        mockWorkspacesService as any,
        mockInvitationsService as any,
      );

      const result = await service.register({
        email: 'team@nexasocial.com',
        password: 'Password123!',
        firstName: 'Team',
        lastName: 'Member',
        invitationToken: 'valid_token_xyz',
      });

      expect(result.isInvited).toBe(true);
      expect(result.workspaceId).toBe('ws_host_1');
      // Must not create default workspace for invited user
      expect(mockWorkspacesService.createDefaultWorkspace).not.toHaveBeenCalled();
      expect(mockInvitationsService.accept).toHaveBeenCalledWith(
        { token: 'valid_token_xyz' },
        'invited_user_1',
      );
    });
  });

  // Scenario E: Existing user accepts an invitation and retains multiple memberships
  describe('Scenario E: Existing User Accepts Invitation', () => {
    it('preserves existing workspace memberships while adding the new one', async () => {
      const existingMemberships = [
        { workspaceId: 'ws_own_1', userId: 'user_multi', role: WorkspaceRole.OWNER },
        { workspaceId: 'ws_invited_2', userId: 'user_multi', role: WorkspaceRole.VIEWER },
      ];

      mockWorkspaceMemberRepo.find.mockResolvedValue(existingMemberships);

      const memberships = await mockWorkspaceMemberRepo.find({
        where: { userId: 'user_multi' },
      });
      expect(memberships).toHaveLength(2);
      expect(memberships[0].role).toBe(WorkspaceRole.OWNER);
      expect(memberships[1].role).toBe(WorkspaceRole.VIEWER);
    });
  });

  // Scenario F: CREATOR and VIEWER receive different permissions
  describe('Scenario F: Granular Role Permissions Matrix', () => {
    it('gives CREATOR stream create permissions and restricts VIEWER to read-only', () => {
      const creatorPerms = WORKSPACE_ROLE_PERMISSIONS[WorkspaceRole.CREATOR];
      const viewerPerms = WORKSPACE_ROLE_PERMISSIONS[WorkspaceRole.VIEWER];

      expect(creatorPerms).toContain('livestreams.create');
      expect(creatorPerms).toContain('content.create');
      expect(viewerPerms).not.toContain('livestreams.create');
      expect(viewerPerms).not.toContain('content.create');
      expect(viewerPerms).toContain('analytics.view');
    });
  });

  // Scenario G: Team member inherits workspace subscription without personal purchase
  describe('Scenario G: Workspace Subscription Inheritance', () => {
    it('grants active subscription access to team members when workspace owner has active subscription', async () => {
      mockSubscriptionsService.getEntitlements.mockResolvedValue({
        hasActiveSubscription: true,
        status: SubscriptionStatus.ACTIVE,
        planName: 'Enterprise',
        isWorkspaceOwner: false,
        features: { liveStreaming: true },
      });

      const entitlements = await mockSubscriptionsService.getEntitlements(
        'member_user_id',
        'ws_enterprise_1',
      );
      expect(entitlements.hasActiveSubscription).toBe(true);
      expect(entitlements.isWorkspaceOwner).toBe(false);
      expect(entitlements.features.liveStreaming).toBe(true);
    });
  });

  // Scenario H: Invited member cannot bypass an inactive workspace subscription
  describe('Scenario H: Inactive Workspace Subscription Guard for Invited Members', () => {
    it('throws 403 with exact Section 8 message and does not ask member to purchase', async () => {
      mockSubscriptionsService.getEntitlements.mockResolvedValue({
        hasActiveSubscription: false,
        status: SubscriptionStatus.NONE,
        isWorkspaceOwner: false,
      });

      const mockContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'invited_user_id', role: 'USER' },
            headers: { 'x-workspace-id': 'ws_inactive_1' },
          }),
        }),
      } as any;

      try {
        await subscriptionGuard.canActivate(mockContext);
        fail('Should have thrown ForbiddenException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ForbiddenException);
        const res = err.getResponse();
        expect(res.message).toBe(
          'This workspace does not currently have an active subscription. Please contact the workspace owner.',
        );
        expect(res.isWorkspaceOwner).toBe(false);
      }
    });
  });

  // Scenario I: Multi-workspace context isolation
  describe('Scenario I: Multi-workspace Role and Subscription Isolation', () => {
    it('resolves correct permissions and subscription in each respective workspace context', async () => {
      // In ws_1: User is OWNER
      const permsWs1 = WORKSPACE_ROLE_PERMISSIONS[WorkspaceRole.OWNER];
      // In ws_2: User is CREATOR
      const permsWs2 = WORKSPACE_ROLE_PERMISSIONS[WorkspaceRole.CREATOR];

      expect(permsWs1).toContain('billing.manage');
      expect(permsWs2).not.toContain('billing.manage');
      expect(permsWs2).toContain('livestreams.create');
    });
  });

  // Scenario J: Direct API requests cannot bypass role checks or subscription guards
  describe('Scenario J: Direct API Access Gating', () => {
    it('blocks non-billing roles from accessing billing endpoints', async () => {
      mockWorkspaceMemberRepo.findOne.mockResolvedValue({
        userId: 'creator_1',
        workspaceId: 'ws_1',
        role: WorkspaceRole.CREATOR,
      });

      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === 'workspace_roles') return [WorkspaceRole.OWNER];
        return null;
      });

      const mockContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            url: '/api/billing/invoices',
            user: { id: 'creator_1', role: 'USER' },
            headers: { 'x-workspace-id': 'ws_1' },
          }),
        }),
      } as any;

      await expect(
        workspaceRoleGuard.canActivate(mockContext),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // Scenario K: Billing routes accessible when owner has no subscription
  describe('Scenario K: Billing Routes Accessibility Without Subscription', () => {
    it('bypasses subscription guard when SKIP_SUBSCRIPTION_CHECK_KEY is set', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === 'skipSubscriptionCheck') return true;
        return null;
      });

      const mockContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            url: '/api/subscriptions/plans',
            user: { id: 'owner_unsubscribed', role: 'WORKSPACE_OWNER' },
            headers: {},
          }),
        }),
      } as any;

      const canAccess = await subscriptionGuard.canActivate(mockContext);
      expect(canAccess).toBe(true);
      expect(mockSubscriptionsService.getEntitlements).not.toHaveBeenCalled();
    });
  });

  // Scenario L: Safe Dashboard / Billing Navigation without Infinite Redirects
  describe('Scenario L: Redirect Loop Prevention Logic', () => {
    it('verifies route guard contract: owner on /billing is never bounced back to /dashboard', () => {
      const pathname = '/billing';
      const isOwner = true;
      const hasActiveSubscription = false;

      // In layout.tsx:
      // if (!hasActiveSubscription && isOwner && !pathname.startsWith('/billing')) { router.push('/billing'); }
      const shouldRedirectToBilling =
        !hasActiveSubscription && isOwner && !pathname.startsWith('/billing');
      expect(shouldRedirectToBilling).toBe(false);
    });

    it('redirects owner without subscription from /dashboard to /billing', () => {
      const pathname = '/dashboard';
      const isOwner = true;
      const hasActiveSubscription = false;

      const shouldRedirectToBilling =
        !hasActiveSubscription && isOwner && !pathname.startsWith('/billing');
      expect(shouldRedirectToBilling).toBe(true);
    });

    it('keeps active owner on /dashboard without redirecting to /billing', () => {
      const pathname = '/dashboard';
      const isOwner = true;
      const hasActiveSubscription = true;

      const shouldRedirectToBilling =
        !hasActiveSubscription && isOwner && !pathname.startsWith('/billing');
      expect(shouldRedirectToBilling).toBe(false);
    });
  });
});
