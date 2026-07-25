import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { ActivityService } from '../../activity/services/activity.service';
import { DashboardCacheHelper } from '../helpers/dashboard-cache.helper';

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
  ) {}

  async getSummary(
    workspaceId: string,
    userId: string,
  ): Promise<DashboardSummaryResponse> {
    // 1. Try cache
    const cached = await this.cacheHelper.get<DashboardSummaryResponse>(
      'summary',
      workspaceId,
    );
    if (cached) return cached;

    // 2. Fetch workspace details
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    // 3. Fetch current subscription
    const sub = await this.subscriptionsService.getCurrentSubscription(userId);

    // 4. Fetch metric counts
    const connectedAccountsCount = await this.accountRepository.count({
      where: { workspaceId },
    });

    const scheduledStreamsCount = await this.streamRepository.count({
      where: { workspaceId, status: StreamStatus.SCHEDULED },
    });

    const liveStreamsCount = await this.streamRepository.count({
      where: { workspaceId, status: StreamStatus.LIVE },
    });

    const teamMembersCount = await this.memberRepository.count({
      where: { workspaceId },
    });

    const notificationsCount = await this.notificationsService.getUnreadCount(
      userId,
      workspaceId,
    );

    const summary: DashboardSummaryResponse = {
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },
      subscription: sub?.plan?.name || 'Free',
      connectedAccounts: connectedAccountsCount,
      scheduledStreams: scheduledStreamsCount,
      liveStreams: liveStreamsCount,
      teamMembers: teamMembersCount,
      notifications: notificationsCount,
    };

    // Store in cache for 60 seconds
    await this.cacheHelper.set('summary', workspaceId, summary);
    return summary;
  }

  async getStatistics(
    workspaceId: string,
  ): Promise<DashboardStatisticsResponse> {
    const cached = await this.cacheHelper.get<DashboardStatisticsResponse>(
      'statistics',
      workspaceId,
    );
    if (cached) return cached;

    const totalStreams = await this.streamRepository.count({
      where: { workspaceId },
    });
    const activeStreams = await this.streamRepository.count({
      where: { workspaceId, status: StreamStatus.LIVE },
    });
    const completedStreams = await this.streamRepository.count({
      where: { workspaceId, status: StreamStatus.ENDED },
    });
    const failedStreams = await this.streamPlatformRepository.count({
      where: {
        status: StreamPlatformStatus.FAILED,
        liveStream: { workspaceId },
      },
    });
    const connectedAccounts = await this.accountRepository.count({
      where: { workspaceId },
    });
    const teamMembers = await this.memberRepository.count({
      where: { workspaceId },
    });

    const statistics: DashboardStatisticsResponse = {
      totalStreams,
      activeStreams,
      completedStreams,
      failedStreams,
      connectedAccounts,
      teamMembers,
    };

    await this.cacheHelper.set('statistics', workspaceId, statistics);
    return statistics;
  }

  async getWidgets(workspaceId: string, userId: string, widgetName?: string) {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });
    const membersCount = await this.memberRepository.count({
      where: { workspaceId },
    });
    const subscription =
      await this.subscriptionsService.getCurrentSubscription(userId);

    const accountsCount = await this.accountRepository.count({
      where: { workspaceId },
    });
    const accounts = await this.accountRepository.find({
      where: { workspaceId },
      take: 10,
    });

    const activeStreams = await this.streamRepository.find({
      where: { workspaceId, status: StreamStatus.LIVE },
      take: 5,
    });
    const scheduledStreams = await this.streamRepository.find({
      where: { workspaceId, status: StreamStatus.SCHEDULED },
      take: 5,
    });

    const stats = await this.getStatistics(workspaceId);
    const unreadNotifications = await this.notificationsService.getUnreadCount(
      userId,
      workspaceId,
    );
    const recentNotifications =
      await this.notificationsService.getUserNotifications(
        userId,
        workspaceId,
        undefined,
        5,
      );
    const recentActivities = await this.activityService.getWorkspaceActivity(
      workspaceId,
      5,
    );

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
