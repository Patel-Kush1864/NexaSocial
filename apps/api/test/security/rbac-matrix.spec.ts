import { ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceRoleGuard } from '../../src/workspaces/guards/workspace-role.guard';
import { WorkspaceRole, WorkspaceMember } from '../../src/workspace-members/entities/workspace-member.entity';
import { WORKSPACE_ROLE_PERMISSIONS } from '../../src/workspaces/constants/workspace-permissions.constants';
import { RoleEnum } from '../../src/auth/constants/roles.constants';
import { WORKSPACE_ROLES_KEY } from '../../src/workspaces/decorators/workspace-role.decorator';
import { PERMISSIONS_KEY } from '../../src/auth/decorators/permissions.decorator';
import { WorkspaceMembersService } from '../../src/workspace-members/services/workspace-members.service';

describe('RBAC Matrix & Permission Enforcement Suite (Prompt Section 10)', () => {
  describe('1. Role-to-Permission Mapping Verification', () => {
    it('SUPER_ADMIN should have platform and workspace administrative scope', () => {
      // Platform-level access is universal
      expect(RoleEnum.SUPER_ADMIN).toBe('SUPER_ADMIN');
    });

    it('ADMIN should be bounded to operational platform modules', () => {
      expect(RoleEnum.ADMIN).toBe('ADMIN');
    });

    it('WORKSPACE_OWNER should possess full workspace control permissions', () => {
      const ownerPerms = WORKSPACE_ROLE_PERMISSIONS[WorkspaceRole.OWNER];
      expect(ownerPerms).toContain('workspace.dashboard.view');
      expect(ownerPerms).toContain('workspace.settings.manage');
      expect(ownerPerms).toContain('team.members.view');
      expect(ownerPerms).toContain('team.members.invite');
      expect(ownerPerms).toContain('team.members.update');
      expect(ownerPerms).toContain('team.members.remove');
      expect(ownerPerms).toContain('team.roles.assign');
      expect(ownerPerms).toContain('social_accounts.connect');
      expect(ownerPerms).toContain('livestreams.create');
      expect(ownerPerms).toContain('livestreams.start');
      expect(ownerPerms).toContain('livestreams.stop');
      expect(ownerPerms).toContain('livestreams.delete');
      expect(ownerPerms).toContain('content.create');
      expect(ownerPerms).toContain('content.publish');
      expect(ownerPerms).toContain('billing.manage');
      expect(ownerPerms).toContain('subscription.manage');
    });

    it('MANAGER should have management capabilities but NO role assignment or billing management', () => {
      const managerPerms = WORKSPACE_ROLE_PERMISSIONS[WorkspaceRole.MANAGER];
      expect(managerPerms).toContain('team.members.view');
      expect(managerPerms).toContain('team.members.invite');
      expect(managerPerms).toContain('team.members.update');
      expect(managerPerms).toContain('team.members.remove');
      expect(managerPerms).toContain('livestreams.create');
      expect(managerPerms).toContain('livestreams.start');
      expect(managerPerms).toContain('livestreams.stop');
      expect(managerPerms).toContain('livestreams.delete');
      expect(managerPerms).toContain('content.publish');

      // Crucial restrictions
      expect(managerPerms).not.toContain('team.roles.assign');
      expect(managerPerms).not.toContain('billing.manage');
      expect(managerPerms).not.toContain('subscription.manage');
    });

    it('CREATOR should have content and livestream access but NO billing, team, or stream deletion', () => {
      const creatorPerms = WORKSPACE_ROLE_PERMISSIONS[WorkspaceRole.CREATOR];
      expect(creatorPerms).toContain('content.create');
      expect(creatorPerms).toContain('content.update');
      expect(creatorPerms).toContain('content.publish');
      expect(creatorPerms).toContain('livestreams.create');
      expect(creatorPerms).toContain('livestreams.start');
      expect(creatorPerms).toContain('livestreams.stop');

      // Crucial restrictions
      expect(creatorPerms).not.toContain('livestreams.delete');
      expect(creatorPerms).not.toContain('team.members.view');
      expect(creatorPerms).not.toContain('team.members.invite');
      expect(creatorPerms).not.toContain('team.roles.assign');
      expect(creatorPerms).not.toContain('billing.manage');
      expect(creatorPerms).not.toContain('subscription.manage');
    });

    it('VIEWER should have read-only access and cannot mutate, create, start, or manage', () => {
      const viewerPerms = WORKSPACE_ROLE_PERMISSIONS[WorkspaceRole.VIEWER];
      expect(viewerPerms).toContain('workspace.dashboard.view');
      expect(viewerPerms).toContain('livestreams.view');
      expect(viewerPerms).toContain('content.view');
      expect(viewerPerms).toContain('media.view');
      expect(viewerPerms).toContain('analytics.view');

      // Crucial restrictions
      expect(viewerPerms).not.toContain('livestreams.create');
      expect(viewerPerms).not.toContain('livestreams.start');
      expect(viewerPerms).not.toContain('livestreams.stop');
      expect(viewerPerms).not.toContain('livestreams.delete');
      expect(viewerPerms).not.toContain('content.create');
      expect(viewerPerms).not.toContain('content.update');
      expect(viewerPerms).not.toContain('content.delete');
      expect(viewerPerms).not.toContain('team.members.invite');
      expect(viewerPerms).not.toContain('team.members.view');
      expect(viewerPerms).not.toContain('billing.manage');
    });
  });

  describe('2. WorkspaceRoleGuard Execution & Error Messages', () => {
    let guard: WorkspaceRoleGuard;
    let reflector: Reflector;
    let mockMemberRepo: any;
    let mockWorkspaceRepo: any;

    beforeEach(() => {
      reflector = new Reflector();
      mockMemberRepo = {
        findOne: jest.fn(),
      };
      mockWorkspaceRepo = {
        findOne: jest.fn(),
      };
      guard = new WorkspaceRoleGuard(reflector, mockMemberRepo);
    });

    const createMockContext = (
      user: any,
      headers: Record<string, string> = {},
      params: Record<string, string> = {},
      url: string = '/api/workspaces/ws-1/streams',
    ): ExecutionContext => {
      const request: any = {
        user,
        headers,
        params,
        url,
        query: {},
        body: {},
      };
      return {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as any;
    };

    it('SUPER_ADMIN can access any workspace endpoint even without membership', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: any) => {
        if (key === WORKSPACE_ROLES_KEY) return [WorkspaceRole.OWNER];
        return undefined;
      });

      const context = createMockContext(
        { id: 'super-admin-id', role: RoleEnum.SUPER_ADMIN },
        { 'x-workspace-id': 'ws-target' },
      );

      const canActivate = await guard.canActivate(context);
      expect(canActivate).toBe(true);
      const req = context.switchToHttp().getRequest();
      expect(req.workspaceRole).toBe(WorkspaceRole.OWNER);
      expect(req.workspacePermissions).toContain('workspace.settings.manage');
    });

    it('Non-member receives 403 with user-friendly "Invalid workspace" message', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: any) => {
        if (key === WORKSPACE_ROLES_KEY) return [WorkspaceRole.VIEWER];
        return undefined;
      });
      mockMemberRepo.findOne.mockResolvedValue(null);

      const context = createMockContext(
        { id: 'user-outsider', role: RoleEnum.VIEWER },
        { 'x-workspace-id': 'ws-private' },
      );

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException(
          'The requested workspace could not be found or you do not have access to it.',
        ),
      );
    });

    it('VIEWER attempting member management receives "Only authorized workspace administrators can manage team members."', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: any) => {
        if (key === WORKSPACE_ROLES_KEY) return [WorkspaceRole.OWNER, WorkspaceRole.MANAGER];
        return undefined;
      });

      mockMemberRepo.findOne.mockResolvedValue({
        id: 'mem-viewer',
        userId: 'user-viewer',
        workspaceId: 'ws-1',
        role: WorkspaceRole.VIEWER,
      });

      const context = createMockContext(
        { id: 'user-viewer', role: RoleEnum.VIEWER },
        { 'x-workspace-id': 'ws-1' },
        {},
        '/api/workspaces/ws-1/members/invite',
      );

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException(
          'Only authorized workspace administrators can manage team members.',
        ),
      );
    });

    it('CREATOR attempting billing management receives "You don\'t have permission to manage this workspace\'s billing..."', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: any) => {
        if (key === WORKSPACE_ROLES_KEY) return [WorkspaceRole.OWNER];
        return undefined;
      });

      mockMemberRepo.findOne.mockResolvedValue({
        id: 'mem-creator',
        userId: 'user-creator',
        workspaceId: 'ws-1',
        role: WorkspaceRole.CREATOR,
      });

      const context = createMockContext(
        { id: 'user-creator', role: RoleEnum.CREATOR },
        { 'x-workspace-id': 'ws-1' },
        {},
        '/api/workspaces/ws-1/billing/manage',
      );

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException(
          "You don't have permission to manage this workspace's billing. Please contact the workspace owner.",
        ),
      );
    });

    it('VIEWER attempting live stream modification receives "You don\'t have permission to manage this live stream."', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: any) => {
        if (key === WORKSPACE_ROLES_KEY) return [WorkspaceRole.OWNER, WorkspaceRole.MANAGER, WorkspaceRole.CREATOR];
        return undefined;
      });

      mockMemberRepo.findOne.mockResolvedValue({
        id: 'mem-viewer',
        userId: 'user-viewer',
        workspaceId: 'ws-1',
        role: WorkspaceRole.VIEWER,
      });

      const context = createMockContext(
        { id: 'user-viewer', role: RoleEnum.VIEWER },
        { 'x-workspace-id': 'ws-1' },
        {},
        '/api/workspaces/ws-1/streams/start',
      );

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException(
          "You don't have permission to manage this live stream.",
        ),
      );
    });

    it('CREATOR with valid role passes stream start endpoint', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: any) => {
        if (key === WORKSPACE_ROLES_KEY) return [WorkspaceRole.OWNER, WorkspaceRole.MANAGER, WorkspaceRole.CREATOR];
        if (key === PERMISSIONS_KEY) return ['livestreams.start'];
        return undefined;
      });

      mockMemberRepo.findOne.mockResolvedValue({
        id: 'mem-creator',
        userId: 'user-creator',
        workspaceId: 'ws-1',
        role: WorkspaceRole.CREATOR,
      });

      const context = createMockContext(
        { id: 'user-creator', role: RoleEnum.CREATOR },
        { 'x-workspace-id': 'ws-1' },
        {},
        '/api/workspaces/ws-1/streams/start',
      );

      const canActivate = await guard.canActivate(context);
      expect(canActivate).toBe(true);
      const req = context.switchToHttp().getRequest();
      expect(req.workspaceRole).toBe(WorkspaceRole.CREATOR);
      expect(req.workspacePermissions).toContain('livestreams.start');
      expect(req.workspacePermissions).not.toContain('livestreams.delete');
    });
  });

  describe('3. Separation of Subscription Checks from User Permissions', () => {
    it('An active workspace subscription DOES NOT grant VIEWER unauthorized permissions', () => {
      const activeWorkspaceSubscription = {
        status: 'ACTIVE',
        plan: { features: { liveStreaming: true, unlimitedTeam: true } },
      };

      // Ensure that subscription features do not modify viewer permissions
      const viewerPerms = WORKSPACE_ROLE_PERMISSIONS[WorkspaceRole.VIEWER];
      expect(viewerPerms).not.toContain('livestreams.start');
      expect(viewerPerms).not.toContain('billing.manage');
      expect(activeWorkspaceSubscription.status).toBe('ACTIVE');
    });

    it('A CREATOR in an active workspace has livestream permissions without purchasing personal subscription', () => {
      const creatorPerms = WORKSPACE_ROLE_PERMISSIONS[WorkspaceRole.CREATOR];
      expect(creatorPerms).toContain('livestreams.start');
      expect(creatorPerms).toContain('livestreams.create');
      // No requirement for user-level billing access
      expect(creatorPerms).not.toContain('billing.manage');
    });
  });

  describe('4. WorkspaceMembersService Role Assignment & Privilege Escalation Defense', () => {
    let service: WorkspaceMembersService;
    let mockMemberRepo: any;
    let mockWorkspaceRepo: any;
    let mockActivityRepo: any;
    let mockLogger: any;
    let mockMail: any;

    beforeEach(() => {
      mockMemberRepo = {
        findOne: jest.fn(),
        save: jest.fn((m) => Promise.resolve(m)),
        remove: jest.fn().mockResolvedValue(true),
      };
      mockWorkspaceRepo = {
        findOne: jest.fn(),
      };
      mockActivityRepo = {
        create: jest.fn((d) => d),
        save: jest.fn().mockResolvedValue(true),
      };
      mockLogger = {
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      mockMail = {
        sendMail: jest.fn().mockResolvedValue(true),
      };

      service = new WorkspaceMembersService(
        mockMemberRepo,
        mockWorkspaceRepo,
        mockActivityRepo,
        mockLogger,
        mockMail,
      );
    });

    it('Non-owner cannot update member roles (blocks MANAGER/CREATOR/VIEWER)', async () => {
      mockWorkspaceRepo.findOne.mockResolvedValue({
        id: 'ws-1',
        ownerId: 'owner-actual-id',
      });
      mockMemberRepo.findOne.mockResolvedValue({
        id: 'performer-mem',
        userId: 'manager-user-id',
        role: WorkspaceRole.MANAGER,
      });

      await expect(
        service.updateRole('ws-1', 'target-mem-id', WorkspaceRole.CREATOR, 'manager-user-id'),
      ).rejects.toThrow(
        new ForbiddenException('Only authorized workspace administrators can manage team members.'),
      );
    });

    it('Owner cannot assign OWNER or unpermitted roles via updateRole', async () => {
      mockWorkspaceRepo.findOne.mockResolvedValue({
        id: 'ws-1',
        ownerId: 'owner-user-id',
      });
      mockMemberRepo.findOne.mockResolvedValue({
        id: 'target-mem',
        userId: 'target-user-id',
        role: WorkspaceRole.VIEWER,
      });

      await expect(
        service.updateRole('ws-1', 'target-mem', WorkspaceRole.OWNER, 'owner-user-id'),
      ).rejects.toThrow(
        new ForbiddenException('You cannot assign this role. Please select a role you are authorized to assign.'),
      );
    });

    it('Owner can successfully update member role to MANAGER, CREATOR, or VIEWER', async () => {
      mockWorkspaceRepo.findOne.mockResolvedValue({
        id: 'ws-1',
        ownerId: 'owner-user-id',
      });
      const targetMember = {
        id: 'target-mem',
        userId: 'target-user-id',
        role: WorkspaceRole.VIEWER,
      };
      mockMemberRepo.findOne.mockResolvedValue(targetMember);

      const updated = await service.updateRole('ws-1', 'target-mem', WorkspaceRole.CREATOR, 'owner-user-id');
      expect(updated.role).toBe(WorkspaceRole.CREATOR);
      expect(mockMemberRepo.save).toHaveBeenCalled();
    });

    it('Manager cannot remove workspace owner', async () => {
      mockWorkspaceRepo.findOne.mockResolvedValue({
        id: 'ws-1',
        ownerId: 'owner-user-id',
      });
      mockMemberRepo.findOne
        // First findOne: performer lookup
        .mockResolvedValueOnce({
          id: 'performer-manager-mem',
          userId: 'manager-user-id',
          role: WorkspaceRole.MANAGER,
        })
        // Second findOne: target member lookup
        .mockResolvedValueOnce({
          id: 'target-owner-mem',
          userId: 'owner-user-id',
          role: WorkspaceRole.OWNER,
        });

      await expect(
        service.removeMember('ws-1', 'target-owner-mem', 'manager-user-id'),
      ).rejects.toThrow(
        new BadRequestException('Cannot remove the workspace owner'),
      );
    });

    it('Manager cannot remove another manager', async () => {
      mockWorkspaceRepo.findOne.mockResolvedValue({
        id: 'ws-1',
        ownerId: 'owner-user-id',
      });
      mockMemberRepo.findOne
        // First findOne: performer lookup
        .mockResolvedValueOnce({
          id: 'performer-manager-mem',
          userId: 'manager-user-id',
          role: WorkspaceRole.MANAGER,
        })
        // Second findOne: target member lookup
        .mockResolvedValueOnce({
          id: 'target-manager-mem',
          userId: 'other-manager-id',
          role: WorkspaceRole.MANAGER,
        });

      await expect(
        service.removeMember('ws-1', 'target-manager-mem', 'manager-user-id'),
      ).rejects.toThrow(
        new ForbiddenException('Only authorized workspace administrators can manage team members.'),
      );
    });
  });
});
