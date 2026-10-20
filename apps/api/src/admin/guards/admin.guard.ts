import {
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../auth/constants/auth.constants';
import { RoleEnum } from '../../auth/constants/roles.constants';

@Injectable()
export class AdminGuard extends JwtAuthGuard {
  constructor(reflector: Reflector) {
    super(reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // First validate the JWT token
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) {
      return false;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: string } }>();
    const user = request.user;

    // Check if the user has an admin role
    if (user?.role !== RoleEnum.ADMIN && user?.role !== RoleEnum.SUPER_ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
