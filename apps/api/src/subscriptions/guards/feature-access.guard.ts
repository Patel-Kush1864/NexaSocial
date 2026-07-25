/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../subscriptions.service';
import { REQUIRE_FEATURE_KEY } from '../decorators/require-feature.decorator';
import { PlanFeatures } from '../../plans/entities/plan.entity';
import { IS_PUBLIC_KEY } from '../../auth/constants/auth.constants';

@Injectable()
export class FeatureAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the endpoint is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Get the required feature from endpoint metadata
    const requiredFeature = this.reflector.getAllAndOverride<
      keyof PlanFeatures
    >(REQUIRE_FEATURE_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredFeature) {
      return true; // No specific feature required
    }

    const sub = await this.subscriptionsService.getCurrentSubscription(user.id);

    // Verify if the active plan supports the requested feature
    const isAllowed = sub.plan.features[requiredFeature];
    if (!isAllowed) {
      throw new ForbiddenException(
        `Feature access restricted ("${requiredFeature}"). Please upgrade your subscription plan to gain access.`,
      );
    }

    return true;
  }
}
