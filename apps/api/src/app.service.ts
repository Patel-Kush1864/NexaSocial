import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './payments/entities/payment.entity';
import {
  RevenueAnalyticsResponse,
  RevenueAnalyticsRange,
  RevenueGrowthPoint,
} from './platform-analytics/types/revenue-analytics.types';
import {
  SocialPlatformAnalyticsResponse,
  SocialPlatform,
} from './platform-analytics/types/social-analytics.types';
import {
  SubscriptionAnalyticsResponse,
  SubscriptionAnalyticsRange,
  SubscriptionGrowthPoint,
} from './platform-analytics/types/subscription-analytics.types';
import {
  UserAnalyticsResponse,
  UserAnalyticsRange,
  UserGrowthPoint,
} from './platform-analytics/types/user-analytics.types';
import {
  WorkspaceAnalyticsResponse,
  WorkspaceAnalyticsRange,
  WorkspaceGrowthPoint,
} from './platform-analytics/types/workspace-analytics.types';
import {
  ConnectedAccount,
  AccountStatus,
} from './social/entities/connected-account.entity';
import {
  UserSubscription,
  SubscriptionStatus,
} from './subscriptions/entities/user-subscription.entity';
import { UserSession } from './users/entities/user-session.entity';
import { User } from './users/entities/user.entity';
import { Workspace } from './workspaces/entities/workspace.entity';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}

@Injectable()
export class PlatformAnalyticsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(UserSubscription)
    private readonly subscriptionRepository: Repository<UserSubscription>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(ConnectedAccount)
    private readonly connectedAccountRepository: Repository<ConnectedAccount>,
  ) {}

  async getUserAnalytics(range: string): Promise<UserAnalyticsResponse> {
    if (!['7d', '30d', '3m', '6m', '1y'].includes(range)) {
      throw new BadRequestException('Invalid analytics range');
    }

    const analyticsRange = range as UserAnalyticsRange;
    const now = new Date();
    const startDate = new Date();

    // Determine the start date
    if (analyticsRange === '7d') {
      startDate.setDate(now.getDate() - 7);
    } else if (analyticsRange === '30d') {
      startDate.setDate(now.getDate() - 30);
    } else if (analyticsRange === '3m') {
      startDate.setMonth(now.getMonth() - 3);
    } else if (analyticsRange === '6m') {
      startDate.setMonth(now.getMonth() - 6);
    } else if (analyticsRange === '1y') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    // Current total users (not soft deleted)
    const totalUsers = await this.userRepository.count();

    // New users within the selected period
    const newUsersCount = await this.userRepository
      .createQueryBuilder('user')
      .where('user.created_at >= :startDate', { startDate })
      .getCount();

    // Suspended users currently
    const suspendedUsersCount = await this.userRepository.count({
      where: { status: 'SUSPENDED' },
    });

    // Active users: unique users with a session updated in the selected period
    const activeUsersResult = await this.sessionRepository
      .createQueryBuilder('session')
      .select('COUNT(DISTINCT session.user_id)', 'count')
      .where('session.updated_at >= :startDate', { startDate })
      .getRawOne<{ count?: string }>();
    const activeUsersCount = parseInt(activeUsersResult?.count || '0', 10);

    // Calculate User Growth time series
    const growth = await this.calculateUserGrowth(
      analyticsRange,
      startDate,
      now,
    );

    return {
      range: analyticsRange,
      summary: {
        totalUsers,
        newUsers: newUsersCount,
        activeUsers: activeUsersCount,
        suspendedUsers: suspendedUsersCount,
      },
      growth,
    };
  }

  private async calculateUserGrowth(
    range: UserAnalyticsRange,
    startDate: Date,
    endDate: Date,
  ): Promise<UserGrowthPoint[]> {
    const points: UserGrowthPoint[] = [];
    const iteratorDate = new Date(startDate);
    iteratorDate.setHours(0, 0, 0, 0); // start of day

    const endDateTime = endDate.getTime();

    // Determine bucket step in days
    let stepDays = 1; // daily by default
    if (range === '6m') stepDays = 7; // weekly
    if (range === '1y') stepDays = 30; // roughly monthly

    // Loop through buckets
    while (iteratorDate.getTime() <= endDateTime) {
      const bucketEnd = new Date(iteratorDate);
      bucketEnd.setDate(bucketEnd.getDate() + stepDays);
      // Ensure we don't go past the actual end date if it's the last bucket
      const bucketDateToUse =
        bucketEnd.getTime() > endDateTime ? endDate : bucketEnd;

      // Count cumulative users up to bucket end
      const cumulativeUsers = await this.userRepository
        .createQueryBuilder('user')
        .withDeleted() // include soft deleted users if they were created before bucket (might want to exclude deleted if required, but let's just use standard where condition)
        .where('user.created_at <= :bucketEnd', { bucketEnd: bucketDateToUse })
        .andWhere('user.deleted_at IS NULL') // exclude currently soft-deleted (or properly handle historical deletion if needed, but current non-deleted is standard)
        .getCount();

      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      let dateLabel = `${monthNames[iteratorDate.getMonth()]} ${iteratorDate.getDate()}`;
      if (range === '1y') {
        dateLabel = `${monthNames[iteratorDate.getMonth()]} ${iteratorDate.getFullYear()}`;
      }

      points.push({
        date: dateLabel,
        users: cumulativeUsers,
      });

      iteratorDate.setDate(iteratorDate.getDate() + stepDays);
    }

    return points;
  }

  async getWorkspaceAnalytics(
    range: string,
  ): Promise<WorkspaceAnalyticsResponse> {
    if (!['7d', '30d', '3m', '6m', '1y'].includes(range)) {
      throw new BadRequestException('Invalid analytics range');
    }

    const analyticsRange = range as WorkspaceAnalyticsRange;
    const now = new Date();
    const startDate = new Date();

    // Determine the start date
    if (analyticsRange === '7d') {
      startDate.setDate(now.getDate() - 7);
    } else if (analyticsRange === '30d') {
      startDate.setDate(now.getDate() - 30);
    } else if (analyticsRange === '3m') {
      startDate.setMonth(now.getMonth() - 3);
    } else if (analyticsRange === '6m') {
      startDate.setMonth(now.getMonth() - 6);
    } else if (analyticsRange === '1y') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    // Current total workspaces (not soft deleted)
    const totalWorkspaces = await this.workspaceRepository.count();

    // New workspaces within the selected period
    const newWorkspacesCount = await this.workspaceRepository
      .createQueryBuilder('workspace')
      .where('workspace.created_at >= :startDate', { startDate })
      .getCount();

    // Active workspaces currently
    const activeWorkspacesCount = await this.workspaceRepository.count({
      where: { status: 'ACTIVE' },
    });

    // Suspended workspaces currently
    const suspendedWorkspacesCount = await this.workspaceRepository.count({
      where: { status: 'SUSPENDED' },
    });

    // Calculate Workspace Growth time series
    const growth = await this.calculateWorkspaceGrowth(
      analyticsRange,
      startDate,
      now,
    );

    return {
      range: analyticsRange,
      summary: {
        totalWorkspaces,
        activeWorkspaces: activeWorkspacesCount,
        suspendedWorkspaces: suspendedWorkspacesCount,
        newWorkspaces: newWorkspacesCount,
      },
      growth,
    };
  }

  private async calculateWorkspaceGrowth(
    range: WorkspaceAnalyticsRange,
    startDate: Date,
    endDate: Date,
  ): Promise<WorkspaceGrowthPoint[]> {
    const points: WorkspaceGrowthPoint[] = [];
    const iteratorDate = new Date(startDate);
    iteratorDate.setHours(0, 0, 0, 0); // start of day

    const endDateTime = endDate.getTime();

    // Determine bucket step in days
    let stepDays = 1; // daily by default
    if (range === '6m') stepDays = 7; // weekly
    if (range === '1y') stepDays = 30; // roughly monthly

    // Loop through buckets
    while (iteratorDate.getTime() <= endDateTime) {
      const bucketEnd = new Date(iteratorDate);
      bucketEnd.setDate(bucketEnd.getDate() + stepDays);
      const bucketDateToUse =
        bucketEnd.getTime() > endDateTime ? endDate : bucketEnd;

      // Count cumulative workspaces up to bucket end
      const cumulativeWorkspaces = await this.workspaceRepository
        .createQueryBuilder('workspace')
        .withDeleted()
        .where('workspace.created_at <= :bucketEnd', {
          bucketEnd: bucketDateToUse,
        })
        .andWhere('workspace.deleted_at IS NULL')
        .getCount();

      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      let dateLabel = `${monthNames[iteratorDate.getMonth()]} ${iteratorDate.getDate()}`;
      if (range === '1y') {
        dateLabel = `${monthNames[iteratorDate.getMonth()]} ${iteratorDate.getFullYear()}`;
      }

      points.push({
        date: dateLabel,
        workspaces: cumulativeWorkspaces,
      });

      iteratorDate.setDate(iteratorDate.getDate() + stepDays);
    }

    return points;
  }

  async getSubscriptionAnalytics(
    range: string,
  ): Promise<SubscriptionAnalyticsResponse> {
    if (!['7d', '30d', '3m', '6m', '1y'].includes(range)) {
      throw new BadRequestException('Invalid analytics range');
    }

    const analyticsRange = range as SubscriptionAnalyticsRange;
    const now = new Date();
    const startDate = new Date();

    // Determine the start date
    if (analyticsRange === '7d') {
      startDate.setDate(now.getDate() - 7);
    } else if (analyticsRange === '30d') {
      startDate.setDate(now.getDate() - 30);
    } else if (analyticsRange === '3m') {
      startDate.setMonth(now.getMonth() - 3);
    } else if (analyticsRange === '6m') {
      startDate.setMonth(now.getMonth() - 6);
    } else if (analyticsRange === '1y') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    // Status counts
    const activeCount = await this.subscriptionRepository.count({
      where: { status: SubscriptionStatus.ACTIVE },
    });

    const trialingCount = await this.subscriptionRepository.count({
      where: { status: SubscriptionStatus.TRIAL },
    });

    const cancelledCount = await this.subscriptionRepository.count({
      where: { status: SubscriptionStatus.CANCELLED },
    });

    const expiredCount = await this.subscriptionRepository.count({
      where: { status: SubscriptionStatus.EXPIRED },
    });

    // Past Due is not represented in the current enum, defaulting to 0.
    const pastDueCount = 0;

    // Calculate Subscription Growth time series
    const growth = await this.calculateSubscriptionGrowth(
      analyticsRange,
      startDate,
      now,
    );

    return {
      range: analyticsRange,
      summary: {
        active: activeCount,
        trialing: trialingCount,
        pastDue: pastDueCount,
        cancelled: cancelledCount,
        expired: expiredCount,
      },
      growth,
    };
  }

  private async calculateSubscriptionGrowth(
    range: SubscriptionAnalyticsRange,
    startDate: Date,
    endDate: Date,
  ): Promise<SubscriptionGrowthPoint[]> {
    const points: SubscriptionGrowthPoint[] = [];
    const iteratorDate = new Date(startDate);
    iteratorDate.setHours(0, 0, 0, 0); // start of day

    const endDateTime = endDate.getTime();

    // Determine bucket step in days
    let stepDays = 1; // daily by default
    if (range === '6m') stepDays = 7; // weekly
    if (range === '1y') stepDays = 30; // roughly monthly

    // Loop through buckets
    while (iteratorDate.getTime() <= endDateTime) {
      const bucketEnd = new Date(iteratorDate);
      bucketEnd.setDate(bucketEnd.getDate() + stepDays);
      const bucketDateToUse =
        bucketEnd.getTime() > endDateTime ? endDate : bucketEnd;

      // Count cumulative subscriptions up to bucket end
      const cumulativeSubscriptions = await this.subscriptionRepository
        .createQueryBuilder('sub')
        .withDeleted()
        .where('sub.created_at <= :bucketEnd', { bucketEnd: bucketDateToUse })
        .andWhere('sub.deleted_at IS NULL')
        .getCount();

      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      let dateLabel = `${monthNames[iteratorDate.getMonth()]} ${iteratorDate.getDate()}`;
      if (range === '1y') {
        dateLabel = `${monthNames[iteratorDate.getMonth()]} ${iteratorDate.getFullYear()}`;
      }

      points.push({
        date: dateLabel,
        subscriptions: cumulativeSubscriptions,
      });

      iteratorDate.setDate(iteratorDate.getDate() + stepDays);
    }

    return points;
  }

  async getRevenueAnalytics(range: string): Promise<RevenueAnalyticsResponse> {
    if (!['7d', '30d', '3m', '6m', '1y'].includes(range)) {
      throw new BadRequestException('Invalid analytics range');
    }

    const analyticsRange = range as RevenueAnalyticsRange;
    const now = new Date();

    const startDate = new Date();
    if (analyticsRange === '7d') {
      startDate.setDate(now.getDate() - 7);
    } else if (analyticsRange === '30d') {
      startDate.setDate(now.getDate() - 30);
    } else if (analyticsRange === '3m') {
      startDate.setMonth(now.getMonth() - 3);
    } else if (analyticsRange === '6m') {
      startDate.setMonth(now.getMonth() - 6);
    } else if (analyticsRange === '1y') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    // Today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayResult = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'sum')
      .where('payment.status = :status', { status: PaymentStatus.SUCCESS })
      .andWhere('payment.created_at >= :start', { start: startOfToday })
      .getRawOne<{ sum?: string }>();
    const todayRevenue = parseFloat(todayResult?.sum || '0');

    // This Month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthResult = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'sum')
      .where('payment.status = :status', { status: PaymentStatus.SUCCESS })
      .andWhere('payment.created_at >= :start', { start: startOfMonth })
      .getRawOne<{ sum?: string }>();
    const monthRevenue = parseFloat(monthResult?.sum || '0');

    // This Year
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const yearResult = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'sum')
      .where('payment.status = :status', { status: PaymentStatus.SUCCESS })
      .andWhere('payment.created_at >= :start', { start: startOfYear })
      .getRawOne<{ sum?: string }>();
    const yearRevenue = parseFloat(yearResult?.sum || '0');

    // Refunds
    const refundResult = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.refunded_amount)', 'sum')
      .where('payment.refunded_amount > 0')
      .getRawOne<{ sum?: string }>();
    const refunds = parseFloat(refundResult?.sum || '0');

    // Failed Payments
    const failedPayments = await this.paymentRepository.count({
      where: { status: PaymentStatus.FAILED },
    });

    // Calculate Revenue Growth time series
    const growth = await this.calculateRevenueGrowth(
      analyticsRange,
      startDate,
      now,
    );

    return {
      range: analyticsRange,
      summary: {
        todayRevenue,
        monthRevenue,
        yearRevenue,
        refunds,
        failedPayments,
      },
      growth,
    };
  }

  private async calculateRevenueGrowth(
    range: RevenueAnalyticsRange,
    startDate: Date,
    endDate: Date,
  ): Promise<RevenueGrowthPoint[]> {
    const points: RevenueGrowthPoint[] = [];
    const iteratorDate = new Date(startDate);
    iteratorDate.setHours(0, 0, 0, 0); // start of day

    const endDateTime = endDate.getTime();

    // Determine bucket step in days
    let stepDays = 1; // daily by default
    if (range === '6m') stepDays = 7; // weekly
    if (range === '1y') stepDays = 30; // roughly monthly

    // Loop through buckets
    while (iteratorDate.getTime() <= endDateTime) {
      const bucketEnd = new Date(iteratorDate);
      bucketEnd.setDate(bucketEnd.getDate() + stepDays);
      const bucketDateToUse =
        bucketEnd.getTime() > endDateTime ? endDate : bucketEnd;

      // Sum revenue in this specific bucket
      const bucketResult = await this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'sum')
        .where('payment.status = :status', { status: PaymentStatus.SUCCESS })
        .andWhere('payment.created_at >= :start', { start: iteratorDate })
        .andWhere('payment.created_at < :end', { end: bucketDateToUse })
        .getRawOne<{ sum?: string }>();

      const bucketRevenue = parseFloat(bucketResult?.sum || '0');

      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      let dateLabel = `${monthNames[iteratorDate.getMonth()]} ${iteratorDate.getDate()}`;
      if (range === '1y') {
        dateLabel = `${monthNames[iteratorDate.getMonth()]} ${iteratorDate.getFullYear()}`;
      }

      points.push({
        date: dateLabel,
        revenue: bucketRevenue,
      });

      iteratorDate.setDate(iteratorDate.getDate() + stepDays);
    }

    return points;
  }

  async getSocialPlatformAnalytics(): Promise<SocialPlatformAnalyticsResponse> {
    const rawResults = await this.connectedAccountRepository
      .createQueryBuilder('account')
      .select('account.platform_name', 'platformName')
      .addSelect('COUNT(*)', 'totalAccounts')
      .addSelect(
        `SUM(CASE WHEN account.status = '${AccountStatus.CONNECTED}' OR account.status = '${AccountStatus.SYNCING}' THEN 1 ELSE 0 END)`,
        'activeConnections',
      )
      .addSelect(
        `SUM(CASE WHEN account.status = '${AccountStatus.ERROR}' OR account.status = '${AccountStatus.TOKEN_EXPIRED}' THEN 1 ELSE 0 END)`,
        'connectionErrors',
      )
      .groupBy('account.platform_name')
      .getRawMany<{
        platformName: string;
        totalAccounts: string;
        activeConnections: string;
        connectionErrors: string;
      }>();

    const resultsMap = new Map<
      string,
      {
        platformName: string;
        totalAccounts: string;
        activeConnections: string;
        connectionErrors: string;
      }
    >();
    rawResults.forEach((row) => {
      resultsMap.set(row.platformName, row);
    });

    const definedPlatforms = [
      { internal: 'YOUTUBE', display: 'YouTube', type: 'YOUTUBE' },
      { internal: 'FACEBOOK', display: 'Facebook', type: 'FACEBOOK' },
      { internal: 'INSTAGRAM', display: 'Instagram', type: 'INSTAGRAM' },
      { internal: 'LINKEDIN', display: 'LinkedIn', type: 'LINKEDIN' },
      { internal: 'TWITTER', display: 'X', type: 'X' },
      { internal: 'TWITCH', display: 'Twitch', type: 'TWITCH' },
      { internal: 'TIKTOK', display: 'TikTok', type: 'TIKTOK' },
    ];

    const platformsData: import('./platform-analytics/types/social-analytics.types').SocialPlatformAnalytics[] =
      definedPlatforms.map((p) => {
        const data = resultsMap.get(p.internal);
        return {
          platform: p.type as SocialPlatform,
          displayName: p.display,
          connectedAccounts: parseInt(data?.totalAccounts || '0', 10),
          activeConnections: parseInt(data?.activeConnections || '0', 10),
          connectionErrors: parseInt(data?.connectionErrors || '0', 10),
          lastSyncAt: null, // No explicit last sync tracking found in schema
          status: 'OPERATIONAL',
        };
      });

    return {
      platforms: platformsData,
      usage: platformsData.map((p) => ({
        platform: p.platform,
        connectedAccounts: p.connectedAccounts,
      })),
    };
  }
}
