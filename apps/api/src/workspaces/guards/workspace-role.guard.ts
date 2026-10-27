/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WorkspaceMember,
  WorkspaceRole,
} from '../../workspace-members/entities/workspace-member.entity';
import { WORKSPACE_ROLES_KEY } from '../decorators/workspace-role.decorator';
import { PERMISSIONS_KEY } from '../../auth/decorators/permissions.decorator';
import { WORKSPACE_ROLE_PERMISSIONS } from '../constants/workspace-permissions.constants';

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(
      WORKSPACE_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Please log in to continue.');
    }

    // Extract workspace ID from headers, query, path, or body safely
    const pathUrl = (request.url || '').toLowerCase();
    const isWorkspacesCollection =
      (request.method === 'GET' && (pathUrl.endsWith('/workspaces') || pathUrl.endsWith('/workspaces/'))) ||
      (request.method === 'POST' && (pathUrl.endsWith('/workspaces') || pathUrl.endsWith('/workspaces/'))) ||
      pathUrl.includes('/workspaces/switch');

    if (isWorkspacesCollection) {
      return true;
    }

    let workspaceId =
      (request.headers?.['x-workspace-id'] as string) ||
      (request.query?.workspaceId as string) ||
      (request.params?.workspaceId as string) ||
      (request.body?.workspaceId as string) ||
      (pathUrl.includes('/workspaces/') ? (request.params?.id as string) : undefined);

    if (!workspaceId) {
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
        return true;
      }

      // Automatically resolve member's active workspace membership if not explicitly passed
      const activeMember = await this.memberRepository.findOne({
        where: { userId: user.id },
        relations: { workspace: true },
        order: { joinedAt: 'ASC' },
      });
      if (activeMember?.workspace && !activeMember.workspace.deleted_at) {
        workspaceId = activeMember.workspaceId;
        request.workspaceId = workspaceId;
        if (request.headers && !request.headers['x-workspace-id']) {
          request.headers['x-workspace-id'] = workspaceId;
        }
      } else {
        throw new ForbiddenException(
          'The requested workspace could not be found or you do not have access to it.',
        );
      }
    }

    if (user.role === 'SUPER_ADMIN') {
      request.workspaceRole = WorkspaceRole.OWNER;
      request.workspacePermissions = WORKSPACE_ROLE_PERMISSIONS[WorkspaceRole.OWNER];
      user.workspaceRole = WorkspaceRole.OWNER;
      user.workspacePermissions = WORKSPACE_ROLE_PERMISSIONS[WorkspaceRole.OWNER];
      return true; // SUPER_ADMIN has full system-wide access
    }

    // Query membership
    const member = await this.memberRepository.findOne({
      where: {
        workspaceId,
        userId: user.id,
      },
    });

    if (!member) {
      if (user.role === 'ADMIN') {
        return true; // Platform admins can inspect workspace operational routes
      }
      throw new ForbiddenException(
        'The requested workspace could not be found or you do not have access to it.',
      );
    }

    // Attach membership context and effective permissions to request
    const rolePermissions = WORKSPACE_ROLE_PERMISSIONS[member.role] || [];
    request.workspaceMember = member;
    request.workspaceRole = member.role;
    request.workspacePermissions = rolePermissions;
    if (user) {
      user.workspaceRole = member.role;
      user.workspacePermissions = rolePermissions;
    }

    // If neither roles nor permissions are required on this route, membership validation is complete
    if ((!requiredRoles || requiredRoles.length === 0) && (!requiredPermissions || requiredPermissions.length === 0)) {
      return true;
    }

    // Verify role requirements
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.includes(member.role);
      if (!hasRole) {
        const path = (request.url || '').toLowerCase();
        let message = "You don't have permission to perform this action. Please contact your workspace administrator.";

        if (path.includes('/members') || path.includes('/invite') || path.includes('/roles')) {
          message = 'Only authorized workspace administrators can manage team members.';
        } else if (path.includes('/billing') || path.includes('/subscription')) {
          message = "You don't have permission to manage this workspace's billing. Please contact the workspace owner.";
        } else if (path.includes('/livestreams') || path.includes('/streams')) {
          message = "You don't have permission to manage this live stream.";
        }

        throw new ForbiddenException(message);
      }
    }

    // Verify granular permission requirements
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.some((perm) =>
        rolePermissions.includes(perm),
      );
      if (!hasPermission) {
        throw new ForbiddenException(
          "You don't have permission to perform this action. Please contact your workspace administrator.",
        );
      }
    }

    return true;
  }
}
