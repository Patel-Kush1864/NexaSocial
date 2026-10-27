import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { CurrentUser } from '../interfaces/current-user.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as CurrentUser & { workspacePermissions?: string[] };

    if (!user) {
      return false;
    }

    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    const effectivePermissions = [
      ...(user.permissions || []),
      ...(user.workspacePermissions || []),
      ...(request.workspacePermissions || []),
    ];

    const hasPermission = requiredPermissions.some((permission) =>
      effectivePermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        "You don't have permission to perform this action.",
      );
    }

    return true;
  }
}
