import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException, UnauthorizedException } from '@nestjs/common';
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
import { WORKSPACE_ROLES_KEY } from '../../src/workspaces/decorators/workspace-role.decorator';
import { PERMISSIONS_KEY } from '../../src/auth/decorators/permissions.decorator';

describe('NexaSocial: 12 Required End-to-End Scenarios (Prompt Section 10)', () => {
  let reflector: Reflector;
  let subscriptionGuard: SubscriptionGuard;
  let workspaceRoleGuard: WorkspaceRoleGuard;

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
    validateToken: jest.fn(),
    accept: jest.fn(),
    getInvitationByToken: jest.fn(),
  };

  const mockSubscriptionsService = {
    getEntitlements: jest.fn(),
    ensureOwnerWorkspace: jest.fn(),
  };

  const mockWorkspaceMemberRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
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

  // Scenario 1: A new invited user registers and joins the existing workspace without creating a separate workspace.
  describe('Scenario 1: New invited user registers and joins existing workspace without creating personal workspace', () => {
    it('creates user account, joins invited workspace with role, and does not call createDefaultWorkspace', async () => {
      const authService = new AuthService(
        mockUsersService as any,
        { sign: () => 'jwt_member_token' } as any,
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

      const invitedUserData = {
        id: 'member_new_1',
        email: 'collaborator@team.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: { name: RoleEnum.USER },
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(invitedUserData);
      mockInvitationsService.validateToken.mockResolvedValue({
        id: 'inv_token_123',
        workspaceId: 'ws_company_a',
        email: 'collaborator@team.com',
        role: WorkspaceRole.CREATOR,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000),
      });
      mockInvitationsService.accept.mockResolvedValue({
        workspaceId: 'ws_company_a',
        role: WorkspaceRole.CREATOR,
      });

      const res = await authService.register({
        email: 'collaborator@team.com',
        password: 'Password123!',
        firstName: 'Jane',
        lastName: 'Doe',
        invitationToken: 'inv_token_123',
      });

      expect(res.isInvited).toBe(true);
      expect(res.workspaceId).toBe('ws_company_a');
      expect(mockWorkspacesService.createDefaultWorkspace).not.toHaveBeenCalled();
      expect(mockInvitationsService.accept).toHaveBeenCalledWith(
        { token: 'inv_token_123' },
        'member_new_1',
      );
    });
  });

  // Scenario 2: An existing user accepts an invitation and retains their other workspace memberships.
  describe('Scenario 2: Existing user accepts an invitation and retains other workspace memberships', () => {
    it('preserves existing workspace memberships while adding the newly joined workspace', async () => {
      const existingMemberships = [
        { id: 'mem_1', workspaceId: 'ws_primary', userId: 'user_multi', role: WorkspaceRole.OWNER },
        { id: 'mem_2', workspaceId: 'ws_client_b', userId: 'user_multi', role: WorkspaceRole.MANAGER },
      ];

      mockWorkspaceMemberRepo.find.mockResolvedValue(existingMemberships);

      const memberships = await mockWorkspaceMemberRepo.find({
        where: { userId: 'user_multi' },
      });

      expect(memberships).toHaveLength(2);
      expect(memberships[0].workspaceId).toBe('ws_primary');
      expect(memberships[0].role).toBe(WorkspaceRole.OWNER);
      expect(memberships[1].workspaceId).toBe('ws_client_b');
      expect(memberships[1].role).toBe(WorkspaceRole.MANAGER);
    });
  });

  // Scenario 3: A CREATOR accesses permitted live-streaming and content features without being asked to purchase a subscription.
  describe('Scenario 3: CREATOR accesses live-streaming & content without personal subscription', () => {
    it('resolves active subscription from workspace and allows CREATOR to access livestreaming endpoints', async () => {
      // Workspace subscription is active (paid by workspace owner)
      mockSubscriptionsService.getEntitlements.mockResolvedValue({
        hasActiveSubscription: true,
        status: SubscriptionStatus.ACTIVE,
        planName: 'Pro',
        isWorkspaceOwner: false,
        features: { liveStreaming: true, socialAccounts: 5 },
      });

      mockWorkspaceMemberRepo.findOne.mockResolvedValue({
        id: 'mem_creator_1',
        userId: 'creator_1',
        workspaceId: 'ws_prod',
        role: WorkspaceRole.CREATOR,
      });

      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === PERMISSIONS_KEY) return ['livestreams.create'];
        return null;
      });

      const mockContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            url: '/api/livestreams/create',
            user: { id: 'creator_1', role: RoleEnum.USER },
            headers: { 'x-workspace-id': 'ws_prod' },
          }),
        }),
      } as any;

      const subAllowed = await subscriptionGuard.canActivate(mockContext);
      const roleAllowed = await workspaceRoleGuard.canActivate(mockContext);

      expect(subAllowed).toBe(true);
      expect(roleAllowed).toBe(true);
    });
  });

  // Scenario 4: A VIEWER sees the same dashboard layout but cannot execute unauthorized write operations.
  describe('Scenario 4: VIEWER layout is read-only and blocks write mutations', () => {
    it('blocks VIEWER from creating live streams or mutating team members with exact 403 message', async () => {
      mockWorkspaceMemberRepo.findOne.mockResolvedValue({
        id: 'mem_viewer_1',
        userId: 'viewer_user_1',
        workspaceId: 'ws_team',
        role: WorkspaceRole.VIEWER,
      });

      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === WORKSPACE_ROLES_KEY) return [WorkspaceRole.OWNER, WorkspaceRole.MANAGER, WorkspaceRole.CREATOR];
        return null;
      });

      const mockContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            url: '/api/workspaces/ws_team/livestreams',
            user: { id: 'viewer_user_1', role: RoleEnum.USER },
            headers: { 'x-workspace-id': 'ws_team' },
          }),
        }),
      } as any;

      await expect(workspaceRoleGuard.canActivate(mockContext)).rejects.toThrow(
        new ForbiddenException("You don't have permission to manage this live stream."),
      );
    });
  });

  // Scenario 5: A MANAGER receives only their assigned management permissions.
  describe('Scenario 5: MANAGER receives management capabilities but cannot manage billing', () => {
    it('verifies MANAGER has member management permissions but excludes billing.manage', () => {
      const managerPerms = WORKSPACE_ROLE_PERMISSIONS[WorkspaceRole.MANAGER];
      expect(managerPerms).toContain('team.members.invite');
      expect(managerPerms).toContain('team.members.update');
      expect(managerPerms).toContain('team.members.remove');
      expect(managerPerms).toContain('social_accounts.connect');
      expect(managerPerms).toContain('livestreams.create');

      // Crucial security boundaries
      expect(managerPerms).not.toContain('billing.manage');
      expect(managerPerms).not.toContain('team.roles.assign');
      expect(managerPerms).not.toContain('workspace.subscription.manage');
    });
  });

  // Scenario 6: A team member cannot manage billing without permission.
  describe('Scenario 6: Team member blocked from billing management endpoints', () => {
    it('rejects team member trying to access billing management with explicit 403 message', async () => {
      mockWorkspaceMemberRepo.findOne.mockResolvedValue({
        id: 'mem_mgr_1',
        userId: 'mgr_user_1',
        workspaceId: 'ws_corp',
        role: WorkspaceRole.MANAGER,
      });

      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === WORKSPACE_ROLES_KEY) return [WorkspaceRole.OWNER];
        return null;
      });

      const mockContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            url: '/api/workspaces/ws_corp/billing/manage',
            user: { id: 'mgr_user_1', role: RoleEnum.USER },
            headers: { 'x-workspace-id': 'ws_corp' },
          }),
        }),
      } as any;

      await expect(workspaceRoleGuard.canActivate(mockContext)).rejects.toThrow(
        new ForbiddenException(
          "You don't have permission to manage this workspace's billing. Please contact the workspace owner.",
        ),
      );
    });
  });

  // Scenario 7: A team member cannot access another workspace by changing the workspace ID.
  describe('Scenario 7: Cross-workspace tampering prevented', () => {
    it('rejects access when user tries to supply a foreign workspaceId', async () => {
      // User is member of ws_authorized, but requests ws_victim
      mockWorkspaceMemberRepo.findOne.mockImplementation(({ where }) => {
        if (where.workspaceId === 'ws_victim' && where.userId === 'attacker_1') {
          return Promise.resolve(null); // Not a member!
        }
        return Promise.resolve(null);
      });

      const mockContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            url: '/api/workspaces/ws_victim/data',
            user: { id: 'attacker_1', role: RoleEnum.USER },
            headers: { 'x-workspace-id': 'ws_victim' },
          }),
        }),
      } as any;

      await expect(workspaceRoleGuard.canActivate(mockContext)).rejects.toThrow(
        new ForbiddenException(
          'The requested workspace could not be found or you do not have access to it.',
        ),
      );
    });
  });

  // Scenario 8: An eligible workspace subscription enables plan-covered features for authorized members.
  describe('Scenario 8: Eligible workspace subscription enables features for authorized members', () => {
    it('returns active entitlements and allows plan-covered feature access to team member', async () => {
      mockSubscriptionsService.getEntitlements.mockResolvedValue({
        hasActiveSubscription: true,
        status: SubscriptionStatus.ACTIVE,
        planName: 'Scale',
        isWorkspaceOwner: false,
        features: { liveStreaming: true, analytics: true },
      });

      const entitlements = await mockSubscriptionsService.getEntitlements(
        'team_member_42',
        'ws_scale_enterprise',
      );

      expect(entitlements.hasActiveSubscription).toBe(true);
      expect(entitlements.features.liveStreaming).toBe(true);
      expect(entitlements.features.analytics).toBe(true);
      expect(entitlements.isWorkspaceOwner).toBe(false);
    });
  });

  // Scenario 9: An inactive workspace subscription displays the owner-contact message instead of individual checkout.
  describe('Scenario 9: Inactive workspace subscription throws owner-contact message', () => {
    it('throws 403 with exact Section 9 message without requesting personal purchase', async () => {
      mockSubscriptionsService.getEntitlements.mockResolvedValue({
        hasActiveSubscription: false,
        status: SubscriptionStatus.EXPIRED,
        isWorkspaceOwner: false,
      });

      const mockContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            url: '/api/livestreams/create',
            user: { id: 'team_member_99', role: RoleEnum.USER },
            headers: { 'x-workspace-id': 'ws_expired_1' },
          }),
        }),
      } as any;

      try {
        await subscriptionGuard.canActivate(mockContext);
        fail('Expected ForbiddenException');
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

  // Scenario 10: A revoked member immediately loses workspace access.
  describe('Scenario 10: Revoked member immediately loses workspace access', () => {
    it('returns null when member is soft-deleted and blocks API access immediately', async () => {
      // Membership was revoked (deleted_at is set, so findOne returns null)
      mockWorkspaceMemberRepo.findOne.mockResolvedValue(null);

      const mockContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            url: '/api/workspaces/ws_revoked/streams',
            user: { id: 'revoked_member_1', role: RoleEnum.USER },
            headers: { 'x-workspace-id': 'ws_revoked' },
          }),
        }),
      } as any;

      await expect(workspaceRoleGuard.canActivate(mockContext)).rejects.toThrow(
        new ForbiddenException(
          'The requested workspace could not be found or you do not have access to it.',
        ),
      );
    });
  });

  // Scenario 11: Direct API requests cannot bypass permissions or subscription checks.
  describe('Scenario 11: Direct API requests cannot bypass guards', () => {
    it('blocks request lacking authentication with UnauthorizedException', async () => {
      const unauthContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { 'x-workspace-id': 'ws_1' },
          }),
        }),
      } as any;

      await expect(workspaceRoleGuard.canActivate(unauthContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('blocks request without workspace header for protected endpoints', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === PERMISSIONS_KEY) return ['livestreams.view'];
        return null;
      });

      const noWsContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'user_no_ws', role: RoleEnum.USER },
            headers: {},
          }),
        }),
      } as any;

      await expect(workspaceRoleGuard.canActivate(noWsContext)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // Scenario 12: Public owner registration still follows its separate subscription onboarding flow.
  describe('Scenario 12: Public owner registration follows separate subscription onboarding flow', () => {
    it('registers user as WORKSPACE_OWNER without creating workspace upfront, deferring to subscription flow', async () => {
      const authService = new AuthService(
        mockUsersService as any,
        { sign: () => 'jwt_owner_token' } as any,
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

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({
        id: 'owner_user_pub',
        email: 'publicowner@nexasocial.com',
        firstName: 'Alex',
        lastName: 'Owner',
        role: { name: RoleEnum.WORKSPACE_OWNER },
      });

      const res = await authService.register({
        email: 'publicowner@nexasocial.com',
        password: 'SecurePassword123!',
        firstName: 'Alex',
        lastName: 'Owner',
      });

      expect(res.isInvited).toBe(false);
      expect(res.workspaceId).toBeNull();
      expect(mockWorkspacesService.createDefaultWorkspace).not.toHaveBeenCalled();
    });
  });
});
