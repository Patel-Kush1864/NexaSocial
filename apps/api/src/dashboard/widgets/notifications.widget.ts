import { Injectable } from '@nestjs/common';
import { DashboardWidgetData } from '../interfaces/dashboard-summary.interface';

@Injectable()
export class NotificationsWidget {
  generate(
    unreadCount: number,
    recentNotifications: any[] = [],
  ): DashboardWidgetData {
    return {
      widgetName: 'Notifications',
      title: 'Recent Notifications',
      data: {
        unreadCount,
        notifications: recentNotifications,
      },
    };
  }
}
