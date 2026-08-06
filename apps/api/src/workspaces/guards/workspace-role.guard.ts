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

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No workspace roles required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Extract workspace ID from headers, query, or path parameters
    const workspaceId =
      (request.headers['x-workspace-id'] as string) ||
      (request.query.workspaceId as string) ||
      (request.params.workspaceId as string) ||
      (request.params.id as string);

    if (!workspaceId) {
      throw new ForbiddenException(
        'Workspace context (x-workspace-id header or path ID) is missing',
      );
    }

    // Query membership
    const member = await this.memberRepository.findOne({
      where: {
        workspaceId,
        userId: user.id,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // Verify role permissions
    const hasRole = requiredRoles.includes(member.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient workspace permissions. Required role: ${requiredRoles.join(', ')}`,
      );
    }

    // Attach membership context to request for reference downstream
    request.workspaceMember = member;

    return true;
  }
}
