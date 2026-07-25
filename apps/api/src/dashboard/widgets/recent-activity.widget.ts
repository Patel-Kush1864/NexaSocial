import { Injectable } from '@nestjs/common';
import { DashboardWidgetData } from '../interfaces/dashboard-summary.interface';

@Injectable()
export class RecentActivityWidget {
  generate(activities: any[] = []): DashboardWidgetData {
    return {
      widgetName: 'RecentActivity',
      title: 'Recent Activity Log',
      data: {
        activities,
      },
    };
  }
}
