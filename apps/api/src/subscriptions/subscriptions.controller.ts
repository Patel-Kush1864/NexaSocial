import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Query,
  Param,
  Headers,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { PurchaseSubscriptionDto } from './dto/purchase-subscription.dto';
import { ChangePlanDto } from './dto/change-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../auth/interfaces/current-user.interface';
import { PlansService } from '../plans/plans.service';
import { PaymentsService } from '../payments/payments.service';
import { Workspace } from '../workspaces/entities/workspace.entity';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly plansService: PlansService,
    private readonly paymentsService: PaymentsService,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
  ) {}

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermission('platform.subscriptions.view')
  async findAll(@Query() query: any) {
    return this.subscriptionsService.findAll(query);
  }

  @Get('platform/all')
  @UseGuards(PermissionsGuard)
  @RequirePermission('platform.subscriptions.view')
  async findAllPlatform(@Query() query: any) {
    return this.subscriptionsService.findAll(query);
  }

  @Get('statistics')
  @UseGuards(PermissionsGuard)
  @RequirePermission('platform.subscriptions.view')
  async getStatistics() {
    return this.subscriptionsService.getStatistics();
  }

  @Get('platform/statistics')
  @UseGuards(PermissionsGuard)
  @RequirePermission('platform.subscriptions.view')
  async getPlatformStatistics() {
    return this.subscriptionsService.getStatistics();
  }

  private async verifyWorkspaceOwner(
    user: CurrentUserType,
    workspaceId?: string,
  ) {
    if (!workspaceId) return;
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return;
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });
    if (workspace && workspace.ownerId !== user.id) {
      throw new ForbiddenException(
        'Only the workspace owner can manage workspace subscriptions',
      );
    }
  }

  @Get('entitlements')
  async getEntitlements(
    @CurrentUser() user: CurrentUserType,
    @Query('workspaceId') queryWorkspaceId?: string,
    @Headers('x-workspace-id') headerWorkspaceId?: string,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    const workspaceId = queryWorkspaceId || headerWorkspaceId;
    return this.subscriptionsService.getEntitlements(user.id, workspaceId);
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('platform.subscriptions.view')
  async findOne(@Param('id') id: string) {
    if (
      id === 'current' ||
      id === 'history' ||
      id === 'statistics' ||
      id === 'entitlements' ||
      id === 'platform'
    ) {
      // Ignore string matching for other endpoints
      return;
    }
    return this.subscriptionsService.findOneById(id);
  }

  @Get('platform/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('platform.subscriptions.view')
  async findOnePlatform(@Param('id') id: string) {
    return this.subscriptionsService.findOneById(id);
  }

  @Post(':id/cancel')
  @UseGuards(PermissionsGuard)
  @RequirePermission('platform.subscriptions.manage')
  async adminCancel(@Param('id') id: string) {
    return this.subscriptionsService.adminCancelSubscription(id);
  }

  @Post('platform/:id/cancel')
  @UseGuards(PermissionsGuard)
  @RequirePermission('platform.subscriptions.manage')
  async adminCancelPlatform(@Param('id') id: string) {
    return this.subscriptionsService.adminCancelSubscription(id);
  }

  @Post('purchase')
  async purchase(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: PurchaseSubscriptionDto,
    @Query('workspaceId') queryWorkspaceId?: string,
    @Headers('x-workspace-id') headerWorkspaceId?: string,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    const workspaceId =
      (dto as any).workspaceId || queryWorkspaceId || headerWorkspaceId;
    await this.verifyWorkspaceOwner(user, workspaceId);

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
  async cancel(
    @CurrentUser() user: CurrentUserType,
    @Query('workspaceId') queryWorkspaceId?: string,
    @Headers('x-workspace-id') headerWorkspaceId?: string,
    @Body('workspaceId') bodyWorkspaceId?: string,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    const workspaceId = bodyWorkspaceId || queryWorkspaceId || headerWorkspaceId;
    await this.verifyWorkspaceOwner(user, workspaceId);
    return this.subscriptionsService.cancelSubscription(user.id);
  }

  @Post('upgrade')
  async upgrade(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: ChangePlanDto,
    @Query('workspaceId') queryWorkspaceId?: string,
    @Headers('x-workspace-id') headerWorkspaceId?: string,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    const workspaceId =
      (dto as any).workspaceId || queryWorkspaceId || headerWorkspaceId;
    await this.verifyWorkspaceOwner(user, workspaceId);
    return this.subscriptionsService.upgradePlan(user.id, dto.planId);
  }

  @Post('downgrade')
  async downgrade(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: ChangePlanDto,
    @Query('workspaceId') queryWorkspaceId?: string,
    @Headers('x-workspace-id') headerWorkspaceId?: string,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    const workspaceId =
      (dto as any).workspaceId || queryWorkspaceId || headerWorkspaceId;
    await this.verifyWorkspaceOwner(user, workspaceId);
    return this.subscriptionsService.downgradePlan(user.id, dto.planId);
  }

  @Post('renew')
  async renew(
    @CurrentUser() user: CurrentUserType,
    @Query('workspaceId') queryWorkspaceId?: string,
    @Headers('x-workspace-id') headerWorkspaceId?: string,
    @Body('workspaceId') bodyWorkspaceId?: string,
  ) {
    if (!user) {
      throw new BadRequestException('User context missing');
    }
    const workspaceId = bodyWorkspaceId || queryWorkspaceId || headerWorkspaceId;
    await this.verifyWorkspaceOwner(user, workspaceId);
    return this.subscriptionsService.renewSubscription(user.id);
  }
}
