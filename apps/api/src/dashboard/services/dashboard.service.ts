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
import {
  ConnectedAccount,
  AccountStatus,
} from '../../social/entities/connected-account.entity';
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
import { SocialAnalyticsSnapshot } from '../entities/social-analytics-snapshot.entity';
import {
  extractAccountFollowers,
  extractAccountInteractions,
  normalizePlatformName,
} from '../helpers/metric-extractor.helper';

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
  DashboardOverviewResponse,
  ChartDataPoint,
  PlatformStat,
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
    @InjectRepository(SocialAnalyticsSnapshot)
    private readonly snapshotRepository: Repository<SocialAnalyticsSnapshot>,
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
    let workspaceEntity: Workspace | null = null;
    if (!isPlatformScope && workspaceId) {
      workspaceEntity = await this.workspaceRepository.findOne({
        where: { id: workspaceId },
      });
      if (!workspaceEntity) throw new NotFoundException('Workspace not found');
      workspaceInfo = {
        id: workspaceEntity.id,
        name: workspaceEntity.name,
        slug: workspaceEntity.slug,
      };
    }

    // 3. Fetch current subscription (skip for platform scope)
    let subscriptionName = 'Platform Wide';
    if (!isPlatformScope) {
      try {
        const subscriberId = workspaceEntity?.ownerId || userId;
        const sub =
          await this.subscriptionsService.findActiveSubscription(subscriberId);
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

    // Calculate real followers and engagement
    const { totalFollowers, hasFollowerData, totalInteractions } =
      await this.getPlatformBreakdownData(workspaceId, isPlatformScope);

    const engagementRate =
      hasFollowerData && totalFollowers > 0 && totalInteractions > 0
        ? Math.round((totalInteractions / totalFollowers) * 100 * 10) / 10
        : null;

    const summary: DashboardSummaryResponse = {
      workspace: workspaceInfo,
      subscription: subscriptionName,
      connectedAccounts: connectedAccountsCount,
      scheduledStreams: scheduledStreamsCount,
      liveStreams: liveStreamsCount,
      teamMembers: teamMembersCount,
      notifications: notificationsCount,

      totalFollowers: hasFollowerData ? totalFollowers : 0,
      hasFollowerData,
      engagementRate,
      hasEngagementData: engagementRate !== null,
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

    const [followerGrowthResult, platformBreakdownResult] = await Promise.all([
      this.getFollowerGrowthData(workspaceId, isPlatformScope, '7d'),
      this.getPlatformBreakdownData(workspaceId, isPlatformScope),
    ]);

    const statistics: DashboardStatisticsResponse = {
      totalStreams,
      activeStreams,
      completedStreams,
      failedStreams,
      connectedAccounts,
      teamMembers,

      followerGrowth: followerGrowthResult.points,
      engagementOverTime: [],
      platformBreakdown: platformBreakdownResult.platforms,
    };

    await this.cacheHelper.set('statistics', cacheKey, statistics);
    return statistics;
  }

  async recordTodayBaselineSnapshots(
    workspaceId?: string,
    connectedAccounts?: ConnectedAccount[],
  ): Promise<void> {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const accounts =
        connectedAccounts ??
        (await this.accountRepository.find({
          where: workspaceId
            ? { workspaceId, status: AccountStatus.CONNECTED }
            : { status: AccountStatus.CONNECTED },
        }));

      for (const account of accounts) {
        const existing = await this.snapshotRepository.findOne({
          where: {
            connectedAccountId: account.id,
            snapshotDate: todayStr,
          },
        });

        const followers = extractAccountFollowers(
          account.platformName,
          account.metadata,
        );
        const interactions = extractAccountInteractions(
          account.platformName,
          account.metadata,
        );

        if (!existing) {
          await this.snapshotRepository.save(
            this.snapshotRepository.create({
              workspaceId: account.workspaceId,
              connectedAccountId: account.id,
              platformName: normalizePlatformName(account.platformName),
              followers: followers ?? 0,
              engagement: interactions ?? 0,
              snapshotDate: todayStr,
            }),
          );
        } else if (
          (followers !== null && existing.followers !== followers) ||
          (interactions !== null && existing.engagement !== interactions)
        ) {
          if (followers !== null) existing.followers = followers;
          if (interactions !== null) existing.engagement = interactions;
          await this.snapshotRepository.save(existing);
        }
      }
    } catch (err: any) {
      console.error(
        '[DashboardService] Error recording baseline snapshot:',
        err?.message || err,
      );
    }
  }

  async getPlatformBreakdownData(
    workspaceId?: string,
    isPlatformScope = false,
  ): Promise<{
    platforms: PlatformStat[];
    totalFollowers: number;
    hasFollowerData: boolean;
    totalInteractions: number;
  }> {
    const whereCondition: any = {};
    if (!isPlatformScope && workspaceId) {
      whereCondition.workspaceId = workspaceId;
    }
    whereCondition.status = AccountStatus.CONNECTED;

    const accounts = await this.accountRepository.find({
      where: whereCondition,
    });

    let totalFollowers = 0;
    let hasFollowerData = false;
    let totalInteractions = 0;

    const platformMap = new Map<
      string,
      { followers: number; interactions: number; hasData: boolean }
    >();

    for (const acc of accounts) {
      const normPlatform = normalizePlatformName(acc.platformName);
      const followers = extractAccountFollowers(acc.platformName, acc.metadata);
      const interactions = extractAccountInteractions(
        acc.platformName,
        acc.metadata,
      );

      if (!platformMap.has(normPlatform)) {
        platformMap.set(normPlatform, {
          followers: 0,
          interactions: 0,
          hasData: false,
        });
      }

      const pData = platformMap.get(normPlatform)!;

      if (followers !== null) {
        pData.followers += followers;
        pData.hasData = true;
        totalFollowers += followers;
        hasFollowerData = true;
      }

      if (interactions !== null) {
        pData.interactions += interactions;
        totalInteractions += interactions;
      }
    }

    const platforms: PlatformStat[] = Array.from(platformMap.entries()).map(
      ([platform, data]) => {
        const percentage =
          totalFollowers > 0
            ? Math.round((data.followers / totalFollowers) * 100)
            : 0;
        const engagement =
          data.followers > 0 && data.interactions > 0
            ? Math.round((data.interactions / data.followers) * 100 * 10) / 10
            : 0;

        return {
          platform,
          followers: data.followers,
          engagement,
          percentage,
        };
      },
    );

    return { platforms, totalFollowers, hasFollowerData, totalInteractions };
  }

  async getFollowerGrowthData(
    workspaceId?: string,
    isPlatformScope = false,
    range = '7d',
  ): Promise<{
    points: ChartDataPoint[];
    hasData: boolean;
    changePercentage: number | null;
  }> {
    let days = 7;
    if (range === '30d') days = 30;
    else if (range === '3m') days = 90;
    else if (range === '6m') days = 180;
    else if (range === '1y') days = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const query = this.snapshotRepository
      .createQueryBuilder('s')
      .select('s.snapshotDate', 'date')
      .addSelect('SUM(s.followers)', 'total')
      .where('s.snapshotDate >= :startDateStr', { startDateStr });

    if (!isPlatformScope && workspaceId) {
      query.andWhere('s.workspaceId = :workspaceId', { workspaceId });
    }

    query.groupBy('s.snapshotDate').orderBy('s.snapshotDate', 'ASC');

    const rows = await query.getRawMany<{
      date: string;
      total: string | number;
    }>();

    if (!rows || rows.length === 0) {
      return { points: [], hasData: false, changePercentage: null };
    }

    const points: ChartDataPoint[] = rows.map((r) => {
      let dateLabel = String(r.date);
      if (dateLabel.includes('T')) {
        dateLabel = dateLabel.split('T')[0];
      }
      return {
        date: dateLabel,
        value: Math.round(Number(r.total) || 0),
      };
    });

    let changePercentage: number | null = null;
    if (points.length >= 2) {
      const first = points[0].value;
      const last = points[points.length - 1].value;
      if (first > 0) {
        changePercentage = Math.round(((last - first) / first) * 100 * 10) / 10;
      }
    }

    return { points, hasData: true, changePercentage };
  }

  async getOverview(
    userId: string,
    isPlatformScope: boolean,
    workspaceId?: string,
    range = '7d',
  ): Promise<DashboardOverviewResponse> {
    if (!isPlatformScope && !workspaceId) {
      throw new BadRequestException(
        'workspaceId is required for workspace scope',
      );
    }

    const cacheKey = `${isPlatformScope ? 'platform' : workspaceId}:${range}`;
    const cached = await this.cacheHelper.get<DashboardOverviewResponse>(
      'overview',
      cacheKey,
    );
    if (cached) return cached;

    // 1. Workspace Info
    let workspaceInfo = {
      id: 'platform',
      name: 'Platform Overview',
      slug: 'platform',
    };
    let workspaceEntity: Workspace | null = null;
    if (!isPlatformScope && workspaceId) {
      workspaceEntity = await this.workspaceRepository.findOne({
        where: { id: workspaceId },
      });
      if (!workspaceEntity) throw new NotFoundException('Workspace not found');
      workspaceInfo = {
        id: workspaceEntity.id,
        name: workspaceEntity.name,
        slug: workspaceEntity.slug,
      };
    }

    // 2. Subscription
    let subscriptionName = 'Platform Wide';
    if (!isPlatformScope) {
      try {
        const subscriberId = workspaceEntity?.ownerId || userId;
        const sub =
          await this.subscriptionsService.findActiveSubscription(subscriberId);
        subscriptionName = sub?.plan?.name || 'Free';
      } catch {
        subscriptionName = 'Free';
      }
    }

    // 3. Accounts & Metrics
    const accountCondition: any = isPlatformScope
      ? { status: AccountStatus.CONNECTED }
      : { workspaceId, status: AccountStatus.CONNECTED };

    const connectedAccounts = await this.accountRepository.find({
      where: accountCondition,
    });

    // Record baseline snapshot for today if not already recorded
    await this.recordTodayBaselineSnapshots(
      isPlatformScope ? undefined : workspaceId,
      connectedAccounts,
    );

    const {
      platforms: platformBreakdown,
      totalFollowers,
      hasFollowerData,
      totalInteractions,
    } = await this.getPlatformBreakdownData(workspaceId, isPlatformScope);

    // 4. Follower Growth Analytics
    const {
      points: followerGrowth,
      hasData: hasAnalyticsData,
      changePercentage,
    } = await this.getFollowerGrowthData(workspaceId, isPlatformScope, range);

    // 5. Streams (Distinguish verified active live broadcasts from scheduled/ended)
    const streamCondition: any = isPlatformScope ? {} : { workspaceId };
    const [activeStreamsList, scheduledStreamsList, activeStreamsCount] =
      await Promise.all([
        this.streamRepository.find({
          where: { ...streamCondition, status: StreamStatus.LIVE },
          relations: { platforms: { connectedAccount: true } },
          order: { created_at: 'DESC' },
          take: 5,
        }),
        this.streamRepository.find({
          where: { ...streamCondition, status: StreamStatus.SCHEDULED },
          relations: { platforms: { connectedAccount: true } },
          order: { scheduledAt: 'ASC' },
          take: 5,
        }),
        this.streamRepository.count({
          where: { ...streamCondition, status: StreamStatus.LIVE },
        }),
      ]);

    const formatStreamItem = (stream: LiveStream) => {
      const platforms = (stream.platforms || []).map((p) => {
        const plat = p.connectedAccount?.platformName || 'CUSTOM';
        return normalizePlatformName(plat);
      });
      return {
        id: stream.id,
        title: stream.title,
        status: stream.status,
        platforms: Array.from(new Set(platforms)),
        startedAt: stream.startedAt || stream.created_at,
        scheduledAt: stream.scheduledAt || null,
      };
    };

    // 6. Recent Activity
    let recentActivity: any[] = [];
    if (!isPlatformScope && workspaceId) {
      try {
        const activityResult = await this.activityService.getWorkspaceActivity(
          workspaceId,
          10,
        );
        recentActivity = (activityResult?.data || []).map((act) => ({
          id: act.id,
          action: act.action,
          module: act.module,
          description: act.description || act.action,
          createdAt: act.created_at,
          metadata: act.metadata,
        }));
      } catch (err: any) {
        console.error(
          '[DashboardService] Error fetching activity:',
          err?.message || err,
        );
      }
    }

    // Engagement rate calculation
    const hasEngagementData =
      hasFollowerData && totalFollowers > 0 && totalInteractions > 0;
    const engagementRate = hasEngagementData
      ? Math.round((totalInteractions / totalFollowers) * 100 * 10) / 10
      : null;

    // Follower change representation
    let followerChange: string | null = null;
    let followerPositive = true;
    let followerSubtitle = 'No follower data synced';

    if (hasFollowerData) {
      if (changePercentage !== null) {
        followerChange = `${changePercentage >= 0 ? '+' : ''}${changePercentage}%`;
        followerPositive = changePercentage >= 0;
        followerSubtitle = `vs previous ${range}`;
      } else {
        followerChange = null;
        followerSubtitle = 'Baseline recorded today';
      }
    }

    const overview: DashboardOverviewResponse = {
      workspace: workspaceInfo,
      subscription: subscriptionName,
      kpis: {
        totalFollowers: {
          value: hasFollowerData ? totalFollowers : 0,
          hasData: hasFollowerData,
          change: followerChange,
          isPositive: followerPositive,
          subtitle: followerSubtitle,
        },
        engagementRate: {
          value: engagementRate,
          hasData: hasEngagementData,
          change: null,
          isPositive: true,
          subtitle: hasEngagementData
            ? 'Based on recent interactions'
            : 'Awaiting platform metrics',
        },
        connectedAccounts: {
          value: connectedAccounts.length,
          activeConnections: connectedAccounts.length,
          subtitle:
            connectedAccounts.length > 0
              ? `${connectedAccounts.length} active connection${connectedAccounts.length === 1 ? '' : 's'}`
              : 'No accounts connected',
        },
        activeStreams: {
          value: activeStreamsCount,
          liveNow: activeStreamsCount,
          subtitle:
            activeStreamsCount > 0
              ? `${activeStreamsCount} broadcasting now`
              : 'No active streams',
        },
      },
      analytics: {
        range,
        followerGrowth,
        hasAnalyticsData,
      },
      platformBreakdown,
      liveStreams: {
        active: activeStreamsList.map(formatStreamItem),
        scheduled: scheduledStreamsList.map(formatStreamItem),
        total: activeStreamsCount + scheduledStreamsList.length,
      },
      recentActivity,
      dataAvailability: {
        followersAvailable: hasFollowerData,
        engagementAvailable: hasEngagementData,
        analyticsAvailable: hasAnalyticsData,
        connectedAccountsCount: connectedAccounts.length,
        liveStreamsCount: activeStreamsCount,
        recentActivityCount: recentActivity.length,
      },
    };

    // Cache for 30 seconds
    await this.cacheHelper.set('overview', cacheKey, overview, 30000);
    return overview;
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
        const subscriberId = workspace?.ownerId || userId;
        const sub =
          await this.subscriptionsService.findActiveSubscription(subscriberId);
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
