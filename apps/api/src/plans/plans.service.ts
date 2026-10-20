/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { CreatePlanDto as PublicCreatePlanDto } from './dto/create-plan.dto';
import {
  CreatePlanDto,
  UpdatePlanDto,
  PlanListQueryDto,
  PlanStatus,
} from './dto/plan-management.dto';
import { AuditService } from '../audit/services/audit.service';
import { AuditMeta } from '../audit/decorators/audit-meta.decorator';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PlanUpdatedEvent } from '../admin/events/plan-updated.event';
import { SubscriptionStatus } from '../subscriptions/entities/user-subscription.entity';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    private readonly auditService: AuditService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  // --- PUBLIC API ---

  async findAll(): Promise<Plan[]> {
    return this.planRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', price: 'ASC' },
    });
  }

  async findOne(idOrCode: string): Promise<Plan> {
    const plan = await this.planRepository.findOne({
      where: [{ id: idOrCode }, { code: idOrCode }],
    });
    if (!plan) {
      throw new NotFoundException(
        `Plan with identifier "${idOrCode}" not found`,
      );
    }
    return plan;
  }

  async findByName(name: string): Promise<Plan> {
    const plan = await this.planRepository.findOne({ where: { name } });
    if (!plan) {
      throw new NotFoundException(`Plan with name "${name}" not found`);
    }
    return plan;
  }

  async create(dto: PublicCreatePlanDto): Promise<Plan> {
    const plan = this.planRepository.create(dto);
    return this.planRepository.save(plan);
  }

  // --- ADMIN API ---

  async getAdminPlans(query: PlanListQueryDto) {
    const {
      search,
      status,
      billingCycle,
      sortBy = 'displayOrder',
      sortOrder = 'ASC',
      page = 1,
      limit = 20,
    } = query;

    const qb = this.planRepository.createQueryBuilder('plan').withDeleted();

    // Map status filter
    if (status) {
      if (status === PlanStatus.ACTIVE) {
        qb.andWhere('plan.isActive = :isActive AND plan.deleted_at IS NULL', {
          isActive: true,
        });
      } else if (status === PlanStatus.INACTIVE) {
        qb.andWhere('plan.isActive = :isActive AND plan.deleted_at IS NULL', {
          isActive: false,
        });
      } else if (status === PlanStatus.ARCHIVED) {
        qb.andWhere('plan.deleted_at IS NOT NULL');
      }
    }

    if (billingCycle) {
      let intervalStr = 'month';
      if (billingCycle === 'YEARLY') intervalStr = 'year';
      if (billingCycle === 'QUARTERLY') intervalStr = 'quarter';
      qb.andWhere('plan.interval = :interval', { interval: intervalStr });
    }

    if (search) {
      qb.andWhere(
        '(plan.name LIKE :search OR plan.code LIKE :search OR plan.description LIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    // Sort mapping
    const sortFieldMap: Record<string, string> = {
      name: 'plan.name',
      code: 'plan.code',
      price: 'plan.price',
      displayOrder: 'plan.display_order',
      createdAt: 'plan.created_at',
      updatedAt: 'plan.updated_at',
    };
    const dbSortField = sortFieldMap[sortBy] || 'plan.display_order';
    qb.orderBy(dbSortField, sortOrder);

    const offset = (page - 1) * limit;
    qb.skip(offset).take(limit);

    // Get basic entities
    const [plans, total] = await qb.getManyAndCount();

    // Get subscriber counts for each plan
    const subscriberCounts: Record<string, number> = {};
    if (plans.length > 0) {
      const planIds = plans.map((p) => p.id);
      const countsRaw = await this.dataSource.query(
        `SELECT plan_id, COUNT(id) as count FROM user_subscriptions WHERE plan_id IN (?) AND status = ? GROUP BY plan_id`,
        [planIds, SubscriptionStatus.ACTIVE],
      );
      for (const row of countsRaw) {
        subscriberCounts[row.plan_id] = parseInt(row.count, 10);
      }
    }

    const mapped = plans.map((plan) => {
      let currentStatus = PlanStatus.ACTIVE;
      if (plan.deleted_at) {
        currentStatus = PlanStatus.ARCHIVED;
      } else if (!plan.isActive) {
        currentStatus = PlanStatus.INACTIVE;
      }

      let billingCycleEnum = 'MONTHLY';
      if (plan.interval === 'year') billingCycleEnum = 'YEARLY';
      if (plan.interval === 'quarter') billingCycleEnum = 'QUARTERLY';

      return {
        id: plan.id,
        name: plan.name,
        code: plan.code || plan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: plan.description,
        price: parseFloat(plan.price as unknown as string) || 0,
        currency: plan.currency || 'INR',
        billingCycle: billingCycleEnum,
        billingType: plan.billingType
          ? plan.billingType.toUpperCase()
          : 'RECURRING',
        durationDays: plan.durationDays || null,
        isPopular: !!plan.isPopular,
        displayOrder: plan.displayOrder ?? 0,
        workspaceLimit: plan.features?.workspaces ?? 1,
        teamMemberLimit: plan.features?.teamMembers ?? 1,
        socialAccountLimit: plan.features?.socialAccounts ?? 1,
        liveStreamLimit:
          plan.features?.maxStreams ?? (plan.features?.liveStreaming ? 100 : 0),
        storageLimit: plan.features?.storageGb ?? 1,
        maxScheduledPosts: plan.features?.maxScheduledPosts ?? -1,
        aiLimit: plan.features?.aiLimit ?? -1,
        analytics: !!plan.features?.analytics,
        scheduling: !!plan.features?.streamScheduling,
        aiFeatures: !!plan.features?.aiFeatures,
        liveStreaming: !!plan.features?.liveStreaming,
        mediaLibrary: plan.features?.mediaLibrary ?? true,
        multiPlatformStreaming: !!plan.features?.multiPlatformStreaming,
        apiAccess: !!plan.features?.apiAccess,
        customBranding: !!plan.features?.customBranding,
        support: plan.features?.prioritySupport ? 'PRIORITY' : 'STANDARD',
        status: currentStatus,
        subscriberCount: subscriberCounts[plan.id] || 0,
        createdAt: plan.created_at,
        updatedAt: plan.updated_at,
      };
    });

    return {
      data: mapped,
      total,
      limit,
      offset,
    };
  }

  async getAdminPlanDetails(id: string) {
    const qb = this.planRepository.createQueryBuilder('plan').withDeleted();
    qb.where('plan.id = :id OR plan.code = :id', { id });
    const plan = await qb.getOne();

    if (!plan) throw new NotFoundException('Plan not found');

    const subCountRaw = await this.dataSource.query(
      `SELECT COUNT(id) as count FROM user_subscriptions WHERE plan_id = ? AND status = ?`,
      [plan.id, SubscriptionStatus.ACTIVE],
    );
    const subscriberCount = parseInt(subCountRaw[0]?.count || '0', 10);

    let currentStatus = PlanStatus.ACTIVE;
    if (plan.deleted_at) {
      currentStatus = PlanStatus.ARCHIVED;
    } else if (!plan.isActive) {
      currentStatus = PlanStatus.INACTIVE;
    }

    let billingCycleEnum = 'MONTHLY';
    if (plan.interval === 'year') billingCycleEnum = 'YEARLY';
    if (plan.interval === 'quarter') billingCycleEnum = 'QUARTERLY';

    return {
      id: plan.id,
      name: plan.name,
      code: plan.code || plan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: plan.description,
      price: parseFloat(plan.price as unknown as string) || 0,
      currency: plan.currency || 'INR',
      billingCycle: billingCycleEnum,
      billingType: plan.billingType
        ? plan.billingType.toUpperCase()
        : 'RECURRING',
      durationDays: plan.durationDays || null,
      isPopular: !!plan.isPopular,
      displayOrder: plan.displayOrder ?? 0,
      workspaceLimit: plan.features?.workspaces ?? 1,
      teamMemberLimit: plan.features?.teamMembers ?? 1,
      socialAccountLimit: plan.features?.socialAccounts ?? 1,
      liveStreamLimit:
        plan.features?.maxStreams ?? (plan.features?.liveStreaming ? 100 : 0),
      storageLimit: plan.features?.storageGb ?? 1,
      maxScheduledPosts: plan.features?.maxScheduledPosts ?? -1,
      aiLimit: plan.features?.aiLimit ?? -1,
      analytics: !!plan.features?.analytics,
      scheduling: !!plan.features?.streamScheduling,
      aiFeatures: !!plan.features?.aiFeatures,
      liveStreaming: !!plan.features?.liveStreaming,
      mediaLibrary: plan.features?.mediaLibrary ?? true,
      multiPlatformStreaming: !!plan.features?.multiPlatformStreaming,
      apiAccess: !!plan.features?.apiAccess,
      customBranding: !!plan.features?.customBranding,
      support: plan.features?.prioritySupport ? 'PRIORITY' : 'STANDARD',
      status: currentStatus,
      subscriberCount,
      createdAt: plan.created_at,
      updatedAt: plan.updated_at,
    };
  }

  async createAdminPlan(
    dto: CreatePlanDto,
    adminUserId: string,
    auditMeta?: AuditMeta,
  ) {
    // Check name uniqueness
    const existingName = await this.planRepository.findOne({
      where: { name: dto.name },
    });
    if (existingName) {
      throw new ConflictException('A plan with this name already exists.');
    }

    const code = (dto.code || dto.name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existingCode = await this.planRepository.findOne({
      where: { code },
    });
    if (existingCode) {
      throw new ConflictException(`A plan with code "${code}" already exists.`);
    }

    let intervalStr = 'month';
    if (dto.billingCycle === 'YEARLY') intervalStr = 'year';
    if (dto.billingCycle === 'QUARTERLY') intervalStr = 'quarter';

    const hasLiveStreaming =
      dto.liveStreaming ??
      (dto.liveStreamLimit !== undefined && dto.liveStreamLimit !== 0);

    const plan = this.planRepository.create({
      name: dto.name,
      code,
      description: dto.description,
      price: dto.price,
      currency: dto.currency || 'INR',
      interval: intervalStr,
      billingType: dto.billingType
        ? dto.billingType.toLowerCase()
        : 'recurring',
      durationDays: dto.durationDays,
      isPopular: !!dto.isPopular,
      displayOrder: dto.displayOrder || 0,
      isActive: true,
      features: {
        workspaces: dto.workspaceLimit,
        socialAccounts: dto.socialAccountLimit,
        teamMembers: dto.teamMemberLimit,
        liveStreaming: hasLiveStreaming,
        maxStreams:
          dto.maxStreams ?? dto.liveStreamLimit ?? (hasLiveStreaming ? 100 : 0),
        analytics: dto.analytics,
        aiFeatures: dto.aiFeatures,
        aiLimit: dto.aiLimit ?? -1,
        prioritySupport:
          dto.support === 'PRIORITY' || dto.support === 'PREMIUM',
        storageGb: dto.storageLimit,
        apiAccess: dto.apiAccess,
        customBranding: dto.customBranding ?? dto.support === 'PREMIUM',
        streamScheduling: dto.scheduling,
        maxScheduledPosts: dto.maxScheduledPosts ?? -1,
        multiPlatformStreaming: dto.multiPlatformStreaming ?? hasLiveStreaming,
        mediaLibrary: dto.mediaLibrary ?? true,
      },
    });

    const saved = await this.planRepository.save(plan);

    await this.auditService.logAction({
      adminUserId,
      action: 'PLAN_CREATED',
      module: 'PLAN',
      targetType: 'PLAN',
      targetId: saved.id,
      targetName: saved.name,
      ipAddress: auditMeta?.ipAddress,
      userAgent: auditMeta?.userAgent,
      requestId: auditMeta?.requestId,
      metadata: { name: saved.name, price: saved.price, code: saved.code },
    });

    return saved;
  }

  async updateAdminPlan(
    id: string,
    dto: UpdatePlanDto,
    adminUserId: string,
    auditMeta?: AuditMeta,
  ) {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');

    if (dto.name && dto.name !== plan.name) {
      const existing = await this.planRepository.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException('A plan with this name already exists.');
      }
      plan.name = dto.name;
    }

    if (dto.code && dto.code !== plan.code) {
      const sanitizedCode = dto.code
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const existingCode = await this.planRepository.findOne({
        where: { code: sanitizedCode },
      });
      if (existingCode && existingCode.id !== plan.id) {
        throw new ConflictException(
          `A plan with code "${sanitizedCode}" already exists.`,
        );
      }
      plan.code = sanitizedCode;
    }

    if (dto.description !== undefined) plan.description = dto.description;
    if (dto.price !== undefined) plan.price = dto.price;
    if (dto.currency !== undefined) plan.currency = dto.currency;
    if (dto.billingType !== undefined)
      plan.billingType = dto.billingType.toLowerCase();
    if (dto.durationDays !== undefined) plan.durationDays = dto.durationDays;
    if (dto.isPopular !== undefined) plan.isPopular = dto.isPopular;
    if (dto.displayOrder !== undefined) plan.displayOrder = dto.displayOrder;

    if (dto.billingCycle) {
      if (dto.billingCycle === 'MONTHLY') plan.interval = 'month';
      else if (dto.billingCycle === 'YEARLY') plan.interval = 'year';
      else if (dto.billingCycle === 'QUARTERLY') plan.interval = 'quarter';
    }

    if (!plan.features) {
      plan.features = {
        workspaces: 1,
        socialAccounts: 1,
        teamMembers: 1,
        liveStreaming: false,
        maxStreams: 0,
        analytics: false,
        aiFeatures: false,
        aiLimit: -1,
        prioritySupport: false,
        storageGb: 1,
        apiAccess: false,
        customBranding: false,
        streamScheduling: false,
        maxScheduledPosts: -1,
        multiPlatformStreaming: false,
        mediaLibrary: true,
      };
    }

    if (dto.workspaceLimit !== undefined)
      plan.features.workspaces = dto.workspaceLimit;
    if (dto.socialAccountLimit !== undefined)
      plan.features.socialAccounts = dto.socialAccountLimit;
    if (dto.teamMemberLimit !== undefined)
      plan.features.teamMembers = dto.teamMemberLimit;
    if (dto.storageLimit !== undefined)
      plan.features.storageGb = dto.storageLimit;
    if (dto.analytics !== undefined) plan.features.analytics = dto.analytics;
    if (dto.scheduling !== undefined)
      plan.features.streamScheduling = dto.scheduling;
    if (dto.aiFeatures !== undefined) plan.features.aiFeatures = dto.aiFeatures;
    if (dto.aiLimit !== undefined) plan.features.aiLimit = dto.aiLimit;
    if (dto.apiAccess !== undefined) plan.features.apiAccess = dto.apiAccess;
    if (dto.mediaLibrary !== undefined)
      plan.features.mediaLibrary = dto.mediaLibrary;
    if (dto.multiPlatformStreaming !== undefined)
      plan.features.multiPlatformStreaming = dto.multiPlatformStreaming;
    if (dto.customBranding !== undefined)
      plan.features.customBranding = dto.customBranding;

    if (dto.liveStreaming !== undefined) {
      plan.features.liveStreaming = dto.liveStreaming;
    } else if (dto.liveStreamLimit !== undefined) {
      plan.features.liveStreaming = dto.liveStreamLimit !== 0;
    }

    if (dto.maxStreams !== undefined) {
      plan.features.maxStreams = dto.maxStreams;
    } else if (dto.liveStreamLimit !== undefined) {
      plan.features.maxStreams = dto.liveStreamLimit;
    }

    if (dto.maxScheduledPosts !== undefined) {
      plan.features.maxScheduledPosts = dto.maxScheduledPosts;
    }

    if (dto.support !== undefined)
      plan.features.prioritySupport =
        dto.support === 'PRIORITY' || dto.support === 'PREMIUM';

    const updated = await this.planRepository.save(plan);

    await this.auditService.logAction({
      adminUserId,
      action: 'PLAN_UPDATED',
      module: 'PLAN',
      targetType: 'PLAN',
      targetId: id,
      targetName: updated.name,
      ipAddress: auditMeta?.ipAddress,
      userAgent: auditMeta?.userAgent,
      requestId: auditMeta?.requestId,
      metadata: { changedFields: Object.keys(dto) },
    });

    this.eventEmitter.emit(
      'plan.updated',
      new PlanUpdatedEvent(id, updated.name, adminUserId),
    );

    return updated;
  }

  async updateAdminPlanStatus(
    id: string,
    status: PlanStatus,
    adminUserId: string,
    auditMeta?: AuditMeta,
  ) {
    const qb = this.planRepository.createQueryBuilder('plan').withDeleted();
    qb.where('plan.id = :id OR plan.code = :id', { id });
    const plan = await qb.getOne();

    if (!plan) throw new NotFoundException('Plan not found');

    if (status === PlanStatus.ACTIVE) {
      if (plan.deleted_at) {
        await this.planRepository.restore(plan.id);
      }
      plan.isActive = true;
      await this.planRepository.save(plan);

      await this.auditService.logAction({
        adminUserId,
        action: 'PLAN_ACTIVATED',
        module: 'PLAN',
        targetType: 'PLAN',
        targetId: plan.id,
        targetName: plan.name,
        ipAddress: auditMeta?.ipAddress,
        userAgent: auditMeta?.userAgent,
        requestId: auditMeta?.requestId,
        metadata: { previousStatus: 'INACTIVE', newStatus: 'ACTIVE' },
      });
    } else if (status === PlanStatus.INACTIVE) {
      if (plan.deleted_at) {
        await this.planRepository.restore(plan.id);
      }
      plan.isActive = false;
      await this.planRepository.save(plan);

      await this.auditService.logAction({
        adminUserId,
        action: 'PLAN_DEACTIVATED',
        module: 'PLAN',
        targetType: 'PLAN',
        targetId: plan.id,
        targetName: plan.name,
        ipAddress: auditMeta?.ipAddress,
        userAgent: auditMeta?.userAgent,
        requestId: auditMeta?.requestId,
        metadata: { previousStatus: 'ACTIVE', newStatus: 'INACTIVE' },
      });
    } else if (status === PlanStatus.ARCHIVED) {
      // Archive means soft delete
      await this.planRepository.softDelete(plan.id);

      await this.auditService.logAction({
        adminUserId,
        action: 'PLAN_ARCHIVED',
        module: 'PLANS',
        targetId: plan.id,
        metadata: { name: plan.name },
      });
    }

    return { success: true, status };
  }
}
