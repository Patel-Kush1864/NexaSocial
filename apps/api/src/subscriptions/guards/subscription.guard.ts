import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../subscriptions.service';
import { SKIP_SUBSCRIPTION_CHECK_KEY } from '../decorators/skip-subscription-check.decorator';
import { REQUIRE_FEATURE_KEY } from '../decorators/require-feature.decorator';
import { PlanFeatures } from '../../plans/entities/plan.entity';
import { IS_PUBLIC_KEY } from '../../auth/constants/auth.constants';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Check if the route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // 2. Check if explicitly skipping subscription check
    const skipCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_SUBSCRIPTION_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skipCheck) {
      return true;
    }

    // 3. Resolve user
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // 4. Platform administrators always bypass customer subscription restrictions
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      return true;
    }

    // Resolve workspace ID from headers, query, params, or body safely
    const pathUrl = (request.url || '').toLowerCase();
    const workspaceId =
      (request.headers?.['x-workspace-id'] as string) ||
      (request.query?.workspaceId as string) ||
      (request.params?.workspaceId as string) ||
      (request.body?.workspaceId as string) ||
      (request.workspaceId as string) ||
      (request.workspaceMember?.workspaceId as string) ||
      (pathUrl.includes('/workspaces/') ? (request.params?.id as string) : undefined);

    // 5. Query workspace subscription entitlement from backend
    const entitlements = await this.subscriptionsService.getEntitlements(
      user.id,
      workspaceId,
    );

    if (!entitlements.hasActiveSubscription) {
      const isOwner = entitlements.isWorkspaceOwner !== false;
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: isOwner
          ? 'Choose a subscription plan to unlock NexaSocial features.'
          : 'This workspace does not currently have an active subscription. Please contact the workspace owner.',
        code: 'SUBSCRIPTION_REQUIRED',
        status: entitlements.status,
        isWorkspaceOwner: isOwner,
      });
    }

    // 6. If a specific plan feature is required, check it against plan features
    const requiredFeature = this.reflector.getAllAndOverride<keyof PlanFeatures>(
      REQUIRE_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredFeature && entitlements.features) {
      const allowed = entitlements.features[requiredFeature];
      if (!allowed) {
        throw new ForbiddenException({
          statusCode: 403,
          error: 'Forbidden',
          message: `Feature '${String(requiredFeature)}' is not included in the workspace subscription plan. Please contact the workspace owner to upgrade.`,
          code: 'PLAN_FEATURE_RESTRICTED',
          requiredFeature,
        });
      }
    }

    return true;
  }
}
