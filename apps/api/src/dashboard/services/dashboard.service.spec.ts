import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { WorkspaceMember } from '../../workspace-members/entities/workspace-member.entity';
import { ConnectedAccount } from '../../social/entities/connected-account.entity';
import { LiveStream } from '../../livestreams/entities/livestream.entity';
import { StreamPlatform } from '../../stream-platforms/entities/stream-platform.entity';
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

describe('DashboardService', () => {
  let service: DashboardService;

  const mockRepository = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn().mockResolvedValue(5),
  });

  const mockSubscriptionsService = () => ({
    getCurrentSubscription: jest.fn().mockResolvedValue({
      plan: { name: 'Professional', features: {} },
      status: 'ACTIVE',
    }),
  });

  const mockNotificationsService = () => ({
    getUnreadCount: jest.fn().mockResolvedValue(3),
    getUserNotifications: jest.fn().mockResolvedValue({ data: [], total: 0 }),
  });

  const mockActivityService = () => ({
    getWorkspaceActivity: jest.fn().mockResolvedValue({ data: [], total: 0 }),
  });

  const mockCacheHelper = () => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    invalidateWorkspaceCache: jest.fn().mockResolvedValue(undefined),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(Workspace), useFactory: mockRepository },
        {
          provide: getRepositoryToken(WorkspaceMember),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(ConnectedAccount),
          useFactory: mockRepository,
        },
        { provide: getRepositoryToken(LiveStream), useFactory: mockRepository },
        {
          provide: getRepositoryToken(StreamPlatform),
          useFactory: mockRepository,
        },
        { provide: SubscriptionsService, useFactory: mockSubscriptionsService },
        { provide: NotificationsService, useFactory: mockNotificationsService },
        { provide: ActivityService, useFactory: mockActivityService },
        { provide: DashboardCacheHelper, useFactory: mockCacheHelper },
        WorkspaceSummaryWidget,
        SubscriptionCardWidget,
        LiveStreamsWidget,
        NotificationsWidget,
        RecentActivityWidget,
        ConnectedPlatformsWidget,
        QuickActionsWidget,
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
