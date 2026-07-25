import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { PurchaseSubscriptionDto } from './dto/purchase-subscription.dto';
import { ChangePlanDto } from './dto/change-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../auth/interfaces/current-user.interface';
import { PlansService } from '../plans/plans.service';
import { PaymentsService } from '../payments/payments.service';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly plansService: PlansService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post('purchase')
  async purchase(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: PurchaseSubscriptionDto,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    const plan = await this.plansService.findOne(dto.planId);
    if (plan.price === 0) {
      // Free plan checkout: Activate immediately without payment flow
      const subscription = await this.subscriptionsService.activateSubscription(
        user.id,
        plan.id,
        'FREE_PLAN_CHECKOUT',
      );
      return { status: 'ACTIVE', subscription };
    }

    // Paid plan checkout: Initiate payment order creation flow
    return this.paymentsService.createOrder(user.id, {
      planId: plan.id,
      gateway: dto.gateway || 'STRIPE',
    });
  }

  @Get('current')
  async getCurrent(@CurrentUser() user: CurrentUserType) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    return this.subscriptionsService.getCurrentSubscription(user.id);
  }

  @Get('history')
  async getHistory(@CurrentUser() user: CurrentUserType) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    return this.subscriptionsService.getSubscriptionHistory(user.id);
  }

  @Post('cancel')
  async cancel(@CurrentUser() user: CurrentUserType) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    return this.subscriptionsService.cancelSubscription(user.id);
  }

  @Post('upgrade')
  async upgrade(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: ChangePlanDto,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    return this.subscriptionsService.upgradePlan(user.id, dto.planId);
  }

  @Post('downgrade')
  async downgrade(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: ChangePlanDto,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    return this.subscriptionsService.downgradePlan(user.id, dto.planId);
  }

  @Post('renew')
  async renew(@CurrentUser() user: CurrentUserType) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    return this.subscriptionsService.renewSubscription(user.id);
  }
}
