/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import {
  UserSubscription,
  SubscriptionStatus,
} from './entities/user-subscription.entity';
import { PlansService } from '../plans/plans.service';
import { PaymentsService } from '../payments/payments.service';
import { ActivityLog } from '../users/entities/activity-log.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import {
  WorkspaceMember,
  WorkspaceRole,
} from '../workspace-members/entities/workspace-member.entity';
import { LoggerServiceWrapper } from '../logger/logger.service';
import { MailService } from '../mail/mail.service';
import { DataSource } from 'typeorm';
import dayjs from 'dayjs';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(UserSubscription)
    private readonly userSubRepository: Repository<UserSubscription>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    private readonly plansService: PlansService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
    private readonly loggerService: LoggerServiceWrapper,
    private readonly mailService: MailService,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
    private readonly dataSource: DataSource,
  ) { }

  private async getUserInfo(
    userId: string,
  ): Promise<{ name: string; email: string }> {
    try {
      const rows = await this.dataSource.query(
        'SELECT first_name, last_name, email FROM `users` WHERE id = ? LIMIT 1',
        [userId],
      );
      if (rows && rows[0]?.email) {
        const name =
          `${rows[0].first_name || ''} ${rows[0].last_name || ''}`.trim() ||
          rows[0].email.split('@')[0];
        return { name, email: rows[0].email };
      }
    } catch {
      // Fallback
    }
    return { name: 'Customer', email: 'user@example.com' };
  }

  async activateSubscription(
    userId: string,
    planId: string,
    gateway: string,
    paymentId?: string,
    stripeSubscriptionId?: string,
    razorpaySubscriptionId?: string,
  ): Promise<UserSubscription> {
    const plan = await this.plansService.findOne(planId);

    // Expire any existing active subscriptions for this user
    await this.userSubRepository.update(
      { userId, status: SubscriptionStatus.ACTIVE },
      { status: SubscriptionStatus.EXPIRED, endDate: new Date() },
    );

    const now = new Date();
    let endDate: Date | null = null;

    if (plan.interval !== 'unlimited') {
      if (plan.durationDays && plan.durationDays > 0) {
        endDate = dayjs(now).add(plan.durationDays, 'day').toDate();
      } else if (plan.interval === 'year') {
        endDate = dayjs(now).add(1, 'year').toDate();
      } else if (plan.interval === 'quarter') {
        endDate = dayjs(now).add(3, 'month').toDate();
      } else {
        endDate = dayjs(now).add(1, 'month').toDate();
      }
    }

    const sub = this.userSubRepository.create({
      userId,
      planId: plan.id,
      status: SubscriptionStatus.ACTIVE,
      startDate: now,
      endDate,
      stripeSubscriptionId,
      razorpaySubscriptionId,
    });
    await this.userSubRepository.save(sub);

    // Subscription activated successfully. Workspace creation is performed by the owner post-purchase.
    this.loggerService.log(
      `Activated subscription for User ${userId}, Plan ${plan.name}`,
      'SubscriptionsService',
      'application',
    );

    // Log to activity logs
    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId,
        action: 'SUBSCRIPTION_ACTIVATED',
        metadata: {
          subscriptionId: sub.id,
          planId: plan.id,
          planName: plan.name,
          gateway,
          paymentId,
        },
      }),
    );

    // Send email alert to user
    try {
      const userInfo = await this.getUserInfo(userId);
      await this.mailService.sendSubscriptionActivated({
        userId,
        name: userInfo.name,
        email: userInfo.email,
        planName: plan.name,
        price: Number(plan.price) || 0,
        currency: plan.currency || 'INR',
        endDate,
        billingCycle:
          plan.interval === 'year'
            ? 'Yearly'
            : plan.interval === 'quarter'
              ? 'Quarterly'
              : 'Monthly',
        subscriptionId: sub.id,
      });
    } catch (e: any) {
      this.logger.error(`Failed to send activation email: ${e.message}`);
    }

    return sub;
  }

  async ensureOwnerWorkspace(
    userId: string,
    workspaceName?: string,
  ): Promise<Workspace | null> {
    // 1. Check if user already owns an active workspace
    const existing = await this.workspaceRepository.findOne({
      where: { ownerId: userId, deleted_at: IsNull() },
    });
    if (existing) {
      // Ensure owner membership exists
      const member = await this.memberRepository.findOne({
        where: { workspaceId: existing.id, userId },
      });
      if (!member) {
        await this.memberRepository.save(
          this.memberRepository.create({
            workspaceId: existing.id,
            userId,
            role: WorkspaceRole.OWNER,
          }),
        );
      }
      return existing;
    }

    // Do not automatically create a workspace without a user-provided name
    if (!workspaceName || !workspaceName.trim()) {
      return null;
    }

    const rawName = workspaceName.trim();
    const cleanSlug =
      rawName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || 'workspace';
    const randSuffix = Math.random().toString(36).substring(2, 6);
    const slug = `${cleanSlug}-${randSuffix}`;

    const workspace = this.workspaceRepository.create({
      name: rawName,
      ownerId: userId,
      slug,
      status: 'ACTIVE',
    });
    const savedWorkspace = await this.workspaceRepository.save(workspace);

    // Create workspace_members record with WORKSPACE_OWNER role
    const newMember = this.memberRepository.create({
      workspaceId: savedWorkspace.id,
      userId,
      role: WorkspaceRole.OWNER,
    });
    await this.memberRepository.save(newMember);

    this.loggerService.log(
      `Workspace provisioned after subscription activation: ${savedWorkspace.name} (ID: ${savedWorkspace.id}) for Owner ${userId}`,
      'SubscriptionsService',
      'application',
    );

    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId,
        action: 'WORKSPACE_CREATED',
        metadata: {
          workspaceId: savedWorkspace.id,
          name: savedWorkspace.name,
          slug: savedWorkspace.slug,
        },
      }),
    );

    return savedWorkspace;
  }

  async findActiveSubscription(
    userId: string,
  ): Promise<UserSubscription | null> {
    const sub = await this.userSubRepository.findOne({
      where: [
        { userId, status: SubscriptionStatus.ACTIVE },
        { userId, status: SubscriptionStatus.CANCELLED },
        { userId, status: SubscriptionStatus.TRIAL },
      ],
      relations: { plan: true },
      order: { created_at: 'DESC' },
    });

    if (!sub) {
      return null;
    }

    if (
      sub.status !== SubscriptionStatus.ACTIVE &&
      sub.status !== SubscriptionStatus.CANCELLED &&
      sub.status !== SubscriptionStatus.TRIAL
    ) {
      return null;
    }

    // If subscription has an endDate and it has elapsed, mark as EXPIRED
    if (sub.endDate && dayjs(sub.endDate).isBefore(dayjs())) {
      sub.status = SubscriptionStatus.EXPIRED;
      await this.userSubRepository.save(sub);
      return null;
    }

    return sub;
  }

  async findActiveSubscriptionForWorkspace(
    workspaceId: string,
  ): Promise<UserSubscription | null> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });
    if (!workspace) {
      return null;
    }
    return this.findActiveSubscription(workspace.ownerId);
  }

  async getCurrentSubscription(userId: string): Promise<UserSubscription> {
    const sub = await this.findActiveSubscription(userId);
    if (!sub) {
      throw new NotFoundException('No active subscription found');
    }
    return sub;
  }

  async getCurrentSubscriptionForWorkspace(
    workspaceId: string,
  ): Promise<UserSubscription> {
    const sub = await this.findActiveSubscriptionForWorkspace(workspaceId);
    if (!sub) {
      throw new NotFoundException('No active subscription found for workspace');
    }
    return sub;
  }

  async getEntitlements(userId: string, workspaceId?: string) {
    let targetWorkspace: Workspace | null = null;
    let isWorkspaceOwner = true;
    let workspaceRole: WorkspaceRole = WorkspaceRole.OWNER;
    let targetSubscriberId = userId;
    let activeSub: UserSubscription | null = null;

    if (workspaceId) {
      targetWorkspace = await this.workspaceRepository.findOne({
        where: { id: workspaceId },
      });

      let member = targetWorkspace
        ? await this.memberRepository.findOne({
          where: { workspaceId: targetWorkspace.id, userId },
        })
        : null;

      let isOwner =
        targetWorkspace?.ownerId === userId ||
        member?.role === WorkspaceRole.OWNER;

      // If workspace is not found or user is not a member (e.g. stale header),
      // look for user's legitimate active workspace membership instead of failing with 403
      if (!targetWorkspace || (!isOwner && !member)) {
        const memberships = await this.memberRepository.find({
          where: { userId },
          relations: { workspace: true },
          order: { created_at: 'ASC' },
        });
        const validMembership = memberships.find(
          (m) => m.workspace && !m.workspace.deleted_at,
        );

        if (validMembership && validMembership.workspace) {
          targetWorkspace = validMembership.workspace;
          member = validMembership;
          isOwner =
            targetWorkspace.ownerId === userId ||
            validMembership.role === WorkspaceRole.OWNER;
        } else if (!targetWorkspace) {
          throw new NotFoundException('Workspace not found');
        } else {
          throw new ForbiddenException(
            'You are not a member of this workspace',
          );
        }
      }

      isWorkspaceOwner = isOwner;
      workspaceRole =
        member?.role || (isOwner ? WorkspaceRole.OWNER : WorkspaceRole.VIEWER);

      // Subscription belongs to the workspace owner
      targetSubscriberId = targetWorkspace.ownerId;
      activeSub = await this.findActiveSubscription(targetSubscriberId);
    } else {
      // Check personal subscription first
      const personalSub = await this.findActiveSubscription(userId);
      if (personalSub) {
        activeSub = personalSub;
        // Check if user already owns an existing workspace
        const existingWorkspace = await this.workspaceRepository.findOne({
          where: { ownerId: userId, deleted_at: IsNull() },
        });
        if (existingWorkspace) {
          targetWorkspace = existingWorkspace;
          targetSubscriberId = userId;
          isWorkspaceOwner = true;
          workspaceRole = WorkspaceRole.OWNER;
        } else {
          // Subscription is active, but owner has not created a workspace yet. Do NOT auto-create!
          targetWorkspace = null;
          targetSubscriberId = userId;
          isWorkspaceOwner = true;
          workspaceRole = WorkspaceRole.OWNER;
        }
      } else {
        // If user has no personal subscription, check if they belong to any active workspace
        const memberships =
          (await this.memberRepository.find({
            where: { userId },
            relations: { workspace: true },
            order: { created_at: 'ASC' },
          })) || [];

        if (memberships.length > 0 && memberships[0].workspace) {
          targetWorkspace = memberships[0].workspace;
          targetSubscriberId = memberships[0].workspace.ownerId;
          isWorkspaceOwner =
            memberships[0].workspace.ownerId === userId ||
            memberships[0].role === WorkspaceRole.OWNER;
          workspaceRole = memberships[0].role;
        }

        for (const m of memberships) {
          if (m.workspace && !m.workspace.deleted_at) {
            const ownerSub = await this.findActiveSubscription(
              m.workspace.ownerId,
            );
            if (ownerSub) {
              targetWorkspace = m.workspace;
              targetSubscriberId = m.workspace.ownerId;
              isWorkspaceOwner =
                m.workspace.ownerId === userId ||
                m.role === WorkspaceRole.OWNER;
              workspaceRole = m.role;
              activeSub = ownerSub;
              break;
            }
          }
        }
      }
    }

    // Retrieve most recent payment if any
    let latestPayment: any = null;
    try {
      const history = await this.paymentsService.getHistory(targetSubscriberId);
      if (history && history.length > 0) {
        latestPayment = history[0];
      }
    } catch {
      // payment service history optional
    }

    if (activeSub && activeSub.plan) {
      return {
        hasActiveSubscription: true,
        status: activeSub.status,
        planId: activeSub.plan.id,
        planName: activeSub.plan.name,
        planCode:
          activeSub.plan.code ||
          activeSub.plan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        planPrice: Number(activeSub.plan.price),
        currency: activeSub.plan.currency || 'INR',
        billingPeriod: activeSub.plan.interval || 'month',
        durationDays: activeSub.plan.durationDays || null,
        isPopular: !!activeSub.plan.isPopular,
        startDate: activeSub.startDate,
        endDate: activeSub.endDate,
        cancelAtPeriodEnd: activeSub.cancelAtPeriodEnd,
        features: activeSub.plan.features,
        workspaceId: targetWorkspace?.id || null,
        workspaceName: targetWorkspace?.name || null,
        workspaceOwnerId: targetWorkspace?.ownerId || null,
        isWorkspaceOwner,
        workspaceRole,
        latestPayment: latestPayment
          ? {
            id: latestPayment.id,
            status: latestPayment.status,
            amount: Number(latestPayment.amount),
            currency: latestPayment.currency,
            gateway: latestPayment.gateway,
            createdAt: latestPayment.created_at,
          }
          : null,
      };
    }

    // Determine non-active status
    let status = 'NONE';
    if (latestPayment?.status === 'PENDING') {
      status = 'PENDING';
    } else if (latestPayment?.status === 'FAILED') {
      status = 'FAILED';
    } else {
      const lastSub = await this.userSubRepository.findOne({
        where: { userId: targetSubscriberId },
        relations: { plan: true },
        order: { created_at: 'DESC' },
      });
      if (lastSub) {
        status = lastSub.status;
      }
    }

    return {
      hasActiveSubscription: false,
      status,
      planId: null,
      planName: null,
      planPrice: 0,
      billingPeriod: null,
      startDate: null,
      endDate: null,
      cancelAtPeriodEnd: false,
      features: null,
      workspaceId: targetWorkspace?.id || null,
      workspaceName: targetWorkspace?.name || null,
      workspaceOwnerId: targetWorkspace?.ownerId || null,
      isWorkspaceOwner,
      workspaceRole,
      latestPayment: latestPayment
        ? {
          id: latestPayment.id,
          status: latestPayment.status,
          amount: Number(latestPayment.amount),
          currency: latestPayment.currency,
          gateway: latestPayment.gateway,
          createdAt: latestPayment.created_at,
        }
        : null,
    };
  }

  async getSubscriptionHistory(userId: string): Promise<UserSubscription[]> {
    return this.userSubRepository.find({
      where: { userId },
      relations: { plan: true },
      order: { created_at: 'DESC' },
    });
  }

  async cancelSubscription(userId: string): Promise<UserSubscription> {
    const sub = await this.getCurrentSubscription(userId);
    if (sub.plan.price === 0) {
      throw new BadRequestException('Cannot cancel a free subscription');
    }

    sub.status = SubscriptionStatus.CANCELLED;
    sub.cancelAtPeriodEnd = true;
    sub.canceledAt = new Date();
    await this.userSubRepository.save(sub);

    this.loggerService.log(
      `Canceled subscription for User ${userId}, Subscription ID ${sub.id}`,
      'SubscriptionsService',
      'application',
    );

    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId,
        action: 'SUBSCRIPTION_CANCELLED',
        metadata: {
          subscriptionId: sub.id,
          planName: sub.plan.name,
        },
      }),
    );

    // Send email alert to user
    try {
      const userInfo = await this.getUserInfo(userId);
      await this.mailService.sendSubscriptionCancelled({
        userId,
        name: userInfo.name,
        email: userInfo.email,
        planName: sub.plan.name,
        effectiveDate: sub.endDate,
        subscriptionId: sub.id,
      });
    } catch (e: any) {
      this.logger.error(`Failed to send cancellation email: ${e.message}`);
    }

    return sub;
  }

  async adminCancelSubscription(id: string): Promise<UserSubscription> {
    const sub = await this.userSubRepository.findOne({
      where: { id },
      relations: { plan: true },
    });
    if (!sub) {
      throw new NotFoundException('Subscription not found');
    }
    if (sub.plan.price === 0) {
      throw new BadRequestException('Cannot cancel a free subscription');
    }

    sub.status = SubscriptionStatus.CANCELLED;
    sub.cancelAtPeriodEnd = true;
    sub.canceledAt = new Date();
    await this.userSubRepository.save(sub);

    this.loggerService.log(
      `Admin canceled subscription ID ${sub.id} for User ${sub.userId}`,
      'SubscriptionsService',
      'application',
    );

    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId: sub.userId,
        action: 'SUBSCRIPTION_CANCELLED',
        metadata: {
          subscriptionId: sub.id,
          planName: sub.plan.name,
          adminAction: true,
        },
      }),
    );

    // Send email alert to user
    try {
      const userInfo = await this.getUserInfo(sub.userId);
      await this.mailService.sendSubscriptionCancelled({
        userId: sub.userId,
        name: userInfo.name,
        email: userInfo.email,
        planName: sub.plan.name,
        effectiveDate: sub.endDate,
        subscriptionId: sub.id,
      });
    } catch (e: any) {
      this.logger.error(
        `Failed to send admin cancellation email: ${e.message}`,
      );
    }

    return sub;
  }

  async upgradePlan(
    userId: string,
    newPlanId: string,
  ): Promise<UserSubscription> {
    const currentSub = await this.getCurrentSubscription(userId);
    const newPlan = await this.plansService.findOne(newPlanId);

    if (
      newPlan.price <= currentSub.plan.price &&
      currentSub.plan.name !== 'Free'
    ) {
      throw new BadRequestException(
        'New plan price must be higher than current plan for upgrade',
      );
    }

    // In production, Stripe/Razorpay would handle prorated upgrades.
    // For NexaSocial, we directly transition the subscription plan to the new tier.
    const upgradedSub = await this.activateSubscription(
      userId,
      newPlanId,
      'UPGRADE',
    );

    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId,
        action: 'PLAN_UPGRADED',
        metadata: {
          fromPlan: currentSub.plan.name,
          toPlan: newPlan.name,
        },
      }),
    );

    try {
      const userInfo = await this.getUserInfo(userId);
      await this.mailService.sendSubscriptionPlanChanged({
        userId,
        name: userInfo.name,
        email: userInfo.email,
        fromPlan: currentSub.plan.name,
        toPlan: newPlan.name,
        changeType: 'upgrade',
        price: Number(newPlan.price) || 0,
        currency: newPlan.currency || 'INR',
        endDate: upgradedSub.endDate,
        subscriptionId: upgradedSub.id,
      });
    } catch (e: any) {
      this.logger.error(`Failed to send plan upgrade email: ${e.message}`);
    }

    return upgradedSub;
  }

  async downgradePlan(
    userId: string,
    newPlanId: string,
  ): Promise<UserSubscription> {
    const currentSub = await this.getCurrentSubscription(userId);
    const newPlan = await this.plansService.findOne(newPlanId);

    if (newPlan.price >= currentSub.plan.price && newPlan.name !== 'Free') {
      throw new BadRequestException(
        'New plan price must be lower than current plan for downgrade',
      );
    }

    // Perform downgrade activation
    const downgradedSub = await this.activateSubscription(
      userId,
      newPlanId,
      'DOWNGRADE',
    );

    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId,
        action: 'PLAN_DOWNGRADED',
        metadata: {
          fromPlan: currentSub.plan.name,
          toPlan: newPlan.name,
        },
      }),
    );

    try {
      const userInfo = await this.getUserInfo(userId);
      await this.mailService.sendSubscriptionPlanChanged({
        userId,
        name: userInfo.name,
        email: userInfo.email,
        fromPlan: currentSub.plan.name,
        toPlan: newPlan.name,
        changeType: 'downgrade',
        price: Number(newPlan.price) || 0,
        currency: newPlan.currency || 'INR',
        endDate: downgradedSub.endDate,
        subscriptionId: downgradedSub.id,
      });
    } catch (e: any) {
      this.logger.error(`Failed to send plan downgrade email: ${e.message}`);
    }

    return downgradedSub;
  }

  async renewSubscription(userId: string): Promise<UserSubscription> {
    const sub = await this.getCurrentSubscription(userId);

    const now = new Date();
    const baseDate =
      sub.endDate && dayjs(sub.endDate).isAfter(dayjs()) ? sub.endDate : now;
    let newEndDate: Date;

    if (sub.plan.durationDays && sub.plan.durationDays > 0) {
      newEndDate = dayjs(baseDate).add(sub.plan.durationDays, 'day').toDate();
    } else if (sub.plan.interval === 'year') {
      newEndDate = dayjs(baseDate).add(1, 'year').toDate();
    } else if (sub.plan.interval === 'quarter') {
      newEndDate = dayjs(baseDate).add(3, 'month').toDate();
    } else {
      newEndDate = dayjs(baseDate).add(1, 'month').toDate();
    }

    sub.endDate = newEndDate;
    sub.status = SubscriptionStatus.ACTIVE;
    await this.userSubRepository.save(sub);

    this.loggerService.log(
      `Renewed subscription for User ${userId}, Subscription ID ${sub.id}`,
      'SubscriptionsService',
      'application',
    );

    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId,
        action: 'SUBSCRIPTION_RENEWED',
        metadata: {
          subscriptionId: sub.id,
          planName: sub.plan.name,
          newEndDate,
        },
      }),
    );

    // Send renewal email
    try {
      const userInfo = await this.getUserInfo(userId);
      await this.mailService.sendSubscriptionRenewed({
        userId,
        name: userInfo.name,
        email: userInfo.email,
        planName: sub.plan.name,
        price: Number(sub.plan.price) || 0,
        currency: sub.plan.currency || 'INR',
        newEndDate,
        billingCycle:
          sub.plan.interval === 'year'
            ? 'Yearly'
            : sub.plan.interval === 'quarter'
              ? 'Quarterly'
              : 'Monthly',
        subscriptionId: sub.id,
      });
    } catch (e: any) {
      this.logger.error(`Failed to send renewal email: ${e.message}`);
    }

    return sub;
  }

  async findAll(query: any): Promise<{ data: any[]; meta: any }> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      planId,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = query;
    const offset = (Number(page) - 1) * Number(limit);

    const qb = this.userSubRepository
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.user', 'user')
      .leftJoinAndSelect('sub.plan', 'plan');

    if (status) {
      qb.andWhere('sub.status = :status', { status });
    }
    if (planId) {
      qb.andWhere('sub.plan_id = :planId', { planId });
    }
    if (startDate) {
      qb.andWhere('sub.start_date >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('sub.start_date <= :endDate', { endDate });
    }
    if (search) {
      qb.andWhere(
        '(user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search OR plan.name LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const validSortFields: Record<string, string> = {
      price: 'plan.price',
      plan: 'plan.name',
      createdAt: 'sub.created_at',
      updatedAt: 'sub.updated_at',
      status: 'sub.status',
    };

    if (sortBy && validSortFields[sortBy]) {
      const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';
      qb.orderBy(validSortFields[sortBy], order);
    } else {
      qb.orderBy('sub.created_at', 'DESC');
    }

    const [items, total] = await qb
      .skip(offset)
      .take(Number(limit))
      .getManyAndCount();

    // Fetch workspaces for these users to include in response
    const userIds = items.map((item) => item.userId);
    let workspaces: Workspace[] = [];
    if (userIds.length > 0) {
      workspaces = await this.workspaceRepository
        .createQueryBuilder('workspace')
        .where('workspace.ownerId IN (:...userIds)', { userIds })
        .getMany();
    }

    const data = items.map((item) => {
      const workspace = workspaces.find((w) => w.ownerId === item.userId);
      return {
        id: item.id,
        workspace: workspace
          ? { id: workspace.id, name: workspace.name }
          : null,
        owner: {
          id: item.user.id,
          name:
            `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim() ||
            'Unknown',
          email: item.user.email,
        },
        plan: item.plan
          ? {
            id: item.plan.id,
            name: item.plan.name,
          }
          : null,
        status: item.status,
        price: item.plan?.price || 0,
        currency: 'INR',
        billingCycle: item.plan?.interval?.toUpperCase() || 'MONTHLY',
        currentPeriodStart: item.startDate,
        currentPeriodEnd: item.endDate,
        nextRenewal: item.endDate,
        createdAt: item.created_at,
      };
    });

    return {
      data,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async getStatistics(): Promise<any> {
    const stats = await this.userSubRepository
      .createQueryBuilder('sub')
      .select('sub.status', 'status')
      .addSelect('COUNT(sub.id)', 'count')
      .groupBy('sub.status')
      .getRawMany();

    const result = {
      total: 0,
      trialing: 0,
      active: 0,
      pastDue: 0,
      cancelled: 0,
      expired: 0,
    };

    stats.forEach((stat) => {
      const count = Number(stat.count);
      result.total += count;
      switch (stat.status) {
        case SubscriptionStatus.TRIAL:
          result.trialing += count;
          break;
        case SubscriptionStatus.ACTIVE:
          result.active += count;
          break;
        case SubscriptionStatus.PAUSED: // map mapped as pastDue if needed or add separate
        case SubscriptionStatus.PENDING:
          result.pastDue += count;
          break;
        case SubscriptionStatus.CANCELLED:
          result.cancelled += count;
          break;
        case SubscriptionStatus.EXPIRED:
          result.expired += count;
          break;
      }
    });

    return result;
  }

  async findOneById(id: string): Promise<any> {
    const sub = await this.userSubRepository.findOne({
      where: { id },
      relations: { user: true, plan: true },
    });

    if (!sub) {
      throw new NotFoundException('Subscription not found');
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { ownerId: sub.userId },
    });

    return {
      id: sub.id,
      status: sub.status,
      workspace: workspace
        ? {
          id: workspace.id,
          name: workspace.name,
        }
        : null,
      owner: {
        id: sub.user.id,
        name:
          `${sub.user.firstName || ''} ${sub.user.lastName || ''}`.trim() ||
          'Unknown',
        email: sub.user.email,
      },
      plan: sub.plan
        ? {
          id: sub.plan.id,
          name: sub.plan.name,
        }
        : null,
      price: sub.plan?.price || 0,
      currency: 'INR',
      billingCycle: sub.plan?.interval?.toUpperCase() || 'MONTHLY',
      currentPeriodStart: sub.startDate,
      currentPeriodEnd: sub.endDate,
      nextRenewal: sub.endDate,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      canceledAt: sub.canceledAt,
      stripeSubscriptionId: sub.stripeSubscriptionId,
      razorpaySubscriptionId: sub.razorpaySubscriptionId,
      createdAt: sub.created_at,
      updatedAt: sub.updated_at,
    };
  }

  async processExpirationJob(): Promise<void> {
    const now = new Date();

    // 1. Process Expired Subscriptions
    const expiredSubs = await this.userSubRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: LessThan(now),
      },
      relations: { plan: true },
    });

    this.logger.log(
      `Subscription Expiry Job: Found ${expiredSubs.length} expired subscriptions`,
    );

    for (const sub of expiredSubs) {
      sub.status = SubscriptionStatus.EXPIRED;
      await this.userSubRepository.save(sub);

      this.loggerService.log(
        `Subscription expired: ID ${sub.id} for User ${sub.userId}`,
        'SubscriptionsService',
        'application',
      );

      await this.activityLogRepository.save(
        this.activityLogRepository.create({
          userId: sub.userId,
          action: 'SUBSCRIPTION_EXPIRED',
          metadata: {
            subscriptionId: sub.id,
            planName: sub.plan.name,
          },
        }),
      );

      // Send email alert to user
      try {
        const userInfo = await this.getUserInfo(sub.userId);
        await this.mailService.sendSubscriptionExpired({
          userId: sub.userId,
          name: userInfo.name,
          email: userInfo.email,
          planName: sub.plan.name,
          subscriptionId: sub.id,
        });
      } catch (e: any) {
        this.logger.error(`Failed to send expiration email: ${e.message}`);
      }
    }

    // 2. Process Expiry Reminders (7 days, 3 days, 1 day before expiration)
    const reminderIntervals = [7, 3, 1];
    for (const days of reminderIntervals) {
      const windowStart = dayjs(now)
        .add(days - 1, 'day')
        .toDate();
      const windowEnd = dayjs(now).add(days, 'day').toDate();

      const expiringSubs = await this.userSubRepository
        .createQueryBuilder('sub')
        .leftJoinAndSelect('sub.plan', 'plan')
        .where('sub.status = :status', { status: SubscriptionStatus.ACTIVE })
        .andWhere('sub.endDate BETWEEN :windowStart AND :windowEnd', {
          windowStart,
          windowEnd,
        })
        .getMany();

      for (const sub of expiringSubs) {
        try {
          const userInfo = await this.getUserInfo(sub.userId);
          await this.mailService.sendSubscriptionExpiringSoon({
            userId: sub.userId,
            name: userInfo.name,
            email: userInfo.email,
            planName: sub.plan.name,
            daysLeft: days,
            expiryDate: sub.endDate!,
            subscriptionId: sub.id,
          });
        } catch (err: any) {
          this.logger.error(
            `Failed to send ${days}d reminder for sub ${sub.id}: ${err.message}`,
          );
        }
      }
    }
  }
}
