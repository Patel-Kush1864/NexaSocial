import { Injectable } from '@nestjs/common';
import { DashboardWidgetData } from '../interfaces/dashboard-summary.interface';

@Injectable()
export class QuickActionsWidget {
  generate(): DashboardWidgetData {
    return {
      widgetName: 'QuickActions',
      title: 'Quick Actions',
      data: {
        actions: [
          {
            id: 'create_stream',
            label: 'Create Live Stream',
            path: '/livestreams/create',
          },
          {
            id: 'schedule_stream',
            label: 'Schedule Stream',
            path: '/livestreams/schedule',
          },
          {
            id: 'connect_account',
            label: 'Connect Social Account',
            path: '/social/connect',
          },
          {
            id: 'invite_member',
            label: 'Invite Team Member',
            path: '/members/invite',
          },
          {
            id: 'upgrade_plan',
            label: 'Upgrade Subscription',
            path: '/subscriptions/upgrade',
          },
        ],
      },
    };
  }
}
