/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { WorkspaceMember } from '../../workspace-members/entities/workspace-member.entity';
import { ConnectedAccount } from '../../social/entities/connected-account.entity';
import {
  LiveStream,
  StreamStatus,
} from '../../livestreams/entities/livestream.entity';
import {
  StreamPlatform,
  StreamPlatformStatus,
} from '../../stream-platforms/entities/stream-platform.entity';
import { User } from '../../users/entities/user.entity';
import { Payment, PaymentStatus } from '../../payments/entities/payment.entity';
import {
  UserSubscription,
  SubscriptionStatus,
} from '../../subscriptions/entities/user-subscription.entity';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { ActivityService } from '../../activity/services/activity.service';
import { DashboardCacheHelper } from '../helpers/dashboard-cache.helper';
import { calculateGrowth } from '../../admin/helpers/growth.helper';

// Widgets
import { WorkspaceSummaryWidget } from '../widgets/workspace-summary.widget';
import { SubscriptionCardWidget } from '../widgets/subscription-card.widget';
import { LiveStreamsWidget } from '../widgets/live-streams.widget';
import { NotificationsWidget } from '../widgets/notifications.widget';
import { RecentActivityWidget } from '../widgets/recent-activity.widget';
import { ConnectedPlatformsWidget } from '../widgets/connected-platforms.widget';
import { QuickActionsWidget } from '../widgets/quick-actions.widget';

// Interfaces
import {
  DashboardSummaryResponse,
  DashboardStatisticsResponse,
} from '../interfaces/dashboard-summary.interface';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
    @InjectRepository(ConnectedAccount)
    private readonly accountRepository: Repository<ConnectedAccount>,
    @InjectRepository(LiveStream)
    private readonly streamRepository: Repository<LiveStream>,
    @InjectRepository(StreamPlatform)
    private readonly streamPlatformRepository: Repository<StreamPlatform>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(UserSubscription)
    private readonly subscriptionRepository: Repository<UserSubscription>,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly notificationsService: NotificationsService,
    private readonly activityService: ActivityService,
    private readonly cacheHelper: DashboardCacheHelper,

    // Widget Generators
    private readonly workspaceSummaryWidget: WorkspaceSummaryWidget,
    private readonly subscriptionCardWidget: SubscriptionCardWidget,
    private readonly liveStreamsWidget: LiveStreamsWidget,
    private readonly notificationsWidget: NotificationsWidget,
    private readonly recentActivityWidget: RecentActivityWidget,
    private readonly connectedPlatformsWidget: ConnectedPlatformsWidget,
    private readonly quickActionsWidget: QuickActionsWidget,
  ) { }

  async getSummary(
    userId: string,
    isPlatformScope: boolean,
    workspaceId?: string,
  ): Promise<DashboardSummaryResponse> {
    if (!isPlatformScope && !workspaceId) {
      throw new BadRequestException(
        'workspaceId is required for workspace scope',
      );
    }

    const cacheKey = isPlatformScope ? 'platform' : `workspace:${workspaceId}`;

    // 1. Try cache
    const cached = await this.cacheHelper.get<DashboardSummaryResponse>(
      'summary',
      cacheKey,
    );
    if (cached) return cached;

    // Base query condition
    const whereCondition = isPlatformScope ? {} : { workspaceId };

    // 2. Fetch workspace details (only if workspace scope)
    let workspaceInfo = {
      id: 'platform',
      name: 'Platform Overview',
      slug: 'platform',
    };
    if (!isPlatformScope && workspaceId) {
      const workspace = await this.workspaceRepository.findOne({
        where: { id: workspaceId },
      });
      if (!workspace) throw new NotFoundException('Workspace not found');
      workspaceInfo = {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      };
    }

    // 3. Fetch current subscription (skip for platform scope)
    let subscriptionName = 'Platform Wide';
    if (!isPlatformScope) {
      try {
        const sub =
          await this.subscriptionsService.findActiveSubscription(userId);
        subscriptionName = sub?.plan?.name || 'None';
      } catch {
        subscriptionName = 'None';
      }
    }

    // 4. Time boundaries for Platform KPIs
    const now = new Date();
    const currentEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    const previousEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999,
    );

    // 5. Fetch metric counts in parallel
    const [
      connectedAccountsCount,
      scheduledStreamsCount,
      liveStreamsCount,
      teamMembersCount,
      notificationsCount,
      // Platform specific:
      currUsers,
      prevUsers,
      currWorkspaces,
      prevWorkspaces,
      currSubscriptions,
      prevSubscriptions,
      currAccounts,
      prevAccounts,
      currStreams,
      prevStreams,
      activeUsersCurr,
      activeUsersPrev,
      failedPaymentsCurr,
      failedPaymentsPrev,
      revenueResultCurr,
      revenueResultPrev,
    ] = await Promise.all([
      // Generic dashboard queries
      this.accountRepository.count({ where: whereCondition }),
      this.streamRepository.count({
        where: { ...whereCondition, status: StreamStatus.SCHEDULED },
      }),
      this.streamRepository.count({
        where: { ...whereCondition, status: StreamStatus.LIVE },
      }),
      isPlatformScope
        ? this.userRepository.count()
        : this.memberRepository.count({ where: whereCondition }),
      isPlatformScope
        ? Promise.resolve(0)
        : this.notificationsService.getUnreadCount(userId, workspaceId),

      // Platform KPI Queries (only if isPlatformScope)
      isPlatformScope
        ? this.userRepository.count({
          where: { created_at: LessThanOrEqual(currentEnd) },
        })
        : Promise.resolve(0),
      isPlatformScope
        ? this.userRepository.count({
          where: { created_at: LessThanOrEqual(previousEnd) },
        })
        : Promise.resolve(0),

      isPlatformScope
        ? this.workspaceRepository.count({
          where: { created_at: LessThanOrEqual(currentEnd) },
        })
        : Promise.resolve(0),
      isPlatformScope
        ? this.workspaceRepository.count({
          where: { created_at: LessThanOrEqual(previousEnd) },
        })
        : Promise.resolve(0),

      isPlatformScope
        ? this.subscriptionRepository.count({
          where: {
            status: SubscriptionStatus.ACTIVE,
            created_at: LessThanOrEqual(currentEnd),
          },
        })
        : Promise.resolve(0),
      isPlatformScope
        ? this.subscriptionRepository.count({
          where: {
            status: SubscriptionStatus.ACTIVE,
            created_at: LessThanOrEqual(previousEnd),
          },
        })
        : Promise.resolve(0),

      isPlatformScope
        ? this.accountRepository.count({
          where: { created_at: LessThanOrEqual(currentEnd) },
        })
        : Promise.resolve(0),
      isPlatformScope
        ? this.accountRepository.count({
          where: { created_at: LessThanOrEqual(previousEnd) },
        })
        : Promise.resolve(0),

      isPlatformScope
        ? this.streamRepository.count({
          where: { created_at: LessThanOrEqual(currentEnd) },
        })
        : Promise.resolve(0),
      isPlatformScope
        ? this.streamRepository.count({
          where: { created_at: LessThanOrEqual(previousEnd) },
        })
        : Promise.resolve(0),

      isPlatformScope
        ? this.userRepository
          .createQueryBuilder('user')
          .innerJoin('user_sessions', 's', 's.user_id = user.id')
          .where('s.updated_at <= :end', { end: currentEnd })
          .getCount()
        : Promise.resolve(0),
      isPlatformScope
        ? this.userRepository
          .createQueryBuilder('user')
          .innerJoin('user_sessions', 's', 's.user_id = user.id')
          .where('s.updated_at <= :end', { end: previousEnd })
          .getCount()
        : Promise.resolve(0),

      isPlatformScope
        ? this.paymentRepository.count({
          where: {
            status: PaymentStatus.FAILED,
            created_at: LessThanOrEqual(currentEnd),
          },
        })
        : Promise.resolve(0),
      isPlatformScope
        ? this.paymentRepository.count({
          where: {
            status: PaymentStatus.FAILED,
            created_at: LessThanOrEqual(previousEnd),
          },
        })
        : Promise.resolve(0),

      isPlatformScope
        ? this.paymentRepository
          .createQueryBuilder('p')
          .select('SUM(p.amount)', 'total')
          .where('p.status = :status', { status: PaymentStatus.SUCCESS })
          .andWhere('p.created_at <= :end', { end: currentEnd })
          .getRawOne()
        : Promise.resolve(null),
      isPlatformScope
        ? this.paymentRepository
          .createQueryBuilder('p')
          .select('SUM(p.amount)', 'total')
          .where('p.status = :status', { status: PaymentStatus.SUCCESS })
          .andWhere('p.created_at <= :end', { end: previousEnd })
          .getRawOne()
        : Promise.resolve(null),
    ]);

    const summary: DashboardSummaryResponse = {
      workspace: workspaceInfo,
      subscription: subscriptionName,
      connectedAccounts: connectedAccountsCount,
      scheduledStreams: scheduledStreamsCount,
      liveStreams: liveStreamsCount,
      teamMembers: teamMembersCount,
      notifications: notificationsCount,

      // Added for frontend alignment
      totalFollowers: 0,
      engagementRate: 0,
      scheduledPosts: 0,
      activeStreams: liveStreamsCount,
    };

    if (isPlatformScope) {
      summary.totalUsers = {
        value: currUsers,
        ...calculateGrowth(currUsers, prevUsers),
      };
      summary.workspaces = {
        value: currWorkspaces,
        ...calculateGrowth(currWorkspaces, prevWorkspaces),
      };
      summary.subscriptions = {
        value: currSubscriptions,
        ...calculateGrowth(currSubscriptions, prevSubscriptions),
      };
      summary.connectedAccounts = {
        value: currAccounts,
        ...calculateGrowth(currAccounts, prevAccounts),
      };
      summary.liveStreams = {
        value: currStreams,
        ...calculateGrowth(currStreams, prevStreams),
      };
      summary.activeUsers = {
        value: activeUsersCurr,
        ...calculateGrowth(activeUsersCurr, activeUsersPrev),
      };
      summary.failedPayments = {
        value: failedPaymentsCurr,
        ...calculateGrowth(failedPaymentsCurr, failedPaymentsPrev),
      };

      const currRevenue = parseFloat(revenueResultCurr?.total || '0');
      const prevRevenue = parseFloat(revenueResultPrev?.total || '0');
      summary.revenue = {
        value: currRevenue,
        ...calculateGrowth(currRevenue, prevRevenue),
        currency: 'USD',
      };
    }

    // Store in cache for 60 seconds
    await this.cacheHelper.set('summary', cacheKey, summary);
    return summary;
  }

  async getStatistics(
    isPlatformScope: boolean,
    workspaceId?: string,
  ): Promise<DashboardStatisticsResponse> {
    if (!isPlatformScope && !workspaceId) {
      throw new BadRequestException(
        'workspaceId is required for workspace scope',
      );
    }
    const cacheKey = isPlatformScope ? 'platform' : `workspace:${workspaceId}`;

    const cached = await this.cacheHelper.get<DashboardStatisticsResponse>(
      'statistics',
      cacheKey,
    );
    if (cached) return cached;

    const whereCondition = isPlatformScope ? {} : { workspaceId };

    const totalStreams = await this.streamRepository.count({
      where: whereCondition,
    });
    const activeStreams = await this.streamRepository.count({
      where: { ...whereCondition, status: StreamStatus.LIVE },
    });
    const completedStreams = await this.streamRepository.count({
      where: { ...whereCondition, status: StreamStatus.ENDED },
    });

    // For failed streams
    const failedStreamsCondition = isPlatformScope
      ? { status: StreamPlatformStatus.FAILED }
      : { status: StreamPlatformStatus.FAILED, liveStream: { workspaceId } };

    const failedStreams = await this.streamPlatformRepository.count({
      where: failedStreamsCondition,
    });

    const connectedAccounts = await this.accountRepository.count({
      where: whereCondition,
    });

    let teamMembers = 0;
    if (isPlatformScope) {
      teamMembers = await this.workspaceRepository.manager
        .getRepository('User')
        .count();
    } else {
      teamMembers = await this.memberRepository.count({
        where: whereCondition,
      });
    }

    const statistics: DashboardStatisticsResponse = {
      totalStreams,
      activeStreams,
      completedStreams,
      failedStreams,
      connectedAccounts,
      teamMembers,

      // Added for frontend alignment
      followerGrowth: [],
      engagementOverTime: [],
      platformBreakdown: [],
    };

    await this.cacheHelper.set('statistics', cacheKey, statistics);
    return statistics;
  }

  async getWidgets(
    userId: string,
    isPlatformScope: boolean,
    workspaceId?: string,
    widgetName?: string,
  ) {
    if (!isPlatformScope && !workspaceId) {
      throw new BadRequestException(
        'workspaceId is required for workspace scope',
      );
    }

    const whereCondition = isPlatformScope ? {} : { workspaceId };

    let workspace: any = {
      id: 'platform',
      name: 'Platform Overview',
      slug: 'platform',
    };
    if (!isPlatformScope && workspaceId) {
      workspace = await this.workspaceRepository.findOne({
        where: { id: workspaceId },
      });
    }

    let membersCount = 0;
    if (isPlatformScope) {
      membersCount = await this.workspaceRepository.manager
        .getRepository('User')
        .count();
    } else {
      membersCount = await this.memberRepository.count({
        where: whereCondition,
      });
    }

    let subscription: any = { plan: { name: 'Platform Wide' } };
    if (!isPlatformScope) {
      try {
        const sub =
          await this.subscriptionsService.findActiveSubscription(userId);
        if (sub) {
          subscription = sub;
        } else {
          subscription = { plan: { name: 'None' } };
        }
      } catch {
        subscription = { plan: { name: 'None' } };
      }
    }

    const accountsCount = await this.accountRepository.count({
      where: whereCondition,
    });
    const accounts = await this.accountRepository.find({
      where: whereCondition,
      take: 10,
    });

    const activeStreams = await this.streamRepository.find({
      where: { ...whereCondition, status: StreamStatus.LIVE },
      take: 5,
    });
    const scheduledStreams = await this.streamRepository.find({
      where: { ...whereCondition, status: StreamStatus.SCHEDULED },
      take: 5,
    });

    const stats = await this.getStatistics(isPlatformScope, workspaceId);

    let unreadNotifications = 0;
    let recentNotifications: { data: any[] } = { data: [] };
    if (!isPlatformScope && workspaceId) {
      unreadNotifications = await this.notificationsService.getUnreadCount(
        userId,
        workspaceId,
      );
      recentNotifications =
        await this.notificationsService.getUserNotifications(
          userId,
          workspaceId,
          undefined,
          5,
        );
    }

    let recentActivities: { data: any[] } = { data: [] };
    if (!isPlatformScope && workspaceId) {
      recentActivities = await this.activityService.getWorkspaceActivity(
        workspaceId,
        5,
      );
    }

    const allWidgets = [
      this.workspaceSummaryWidget.generate(workspace, membersCount),
      this.subscriptionCardWidget.generate(subscription),
      this.liveStreamsWidget.generate(stats, activeStreams, scheduledStreams),
      this.notificationsWidget.generate(
        unreadNotifications,
        recentNotifications.data,
      ),
      this.recentActivityWidget.generate(recentActivities.data),
      this.connectedPlatformsWidget.generate(accountsCount, accounts),
      this.quickActionsWidget.generate(),
    ];

    if (widgetName) {
      const found = allWidgets.find(
        (w) => w.widgetName.toLowerCase() === widgetName.toLowerCase(),
      );
      if (!found)
        throw new NotFoundException(`Widget '${widgetName}' not found`);
      return found;
    }

    return allWidgets;
  }
}
