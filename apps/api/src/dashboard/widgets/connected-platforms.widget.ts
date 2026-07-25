import { Injectable } from '@nestjs/common';
import { DashboardWidgetData } from '../interfaces/dashboard-summary.interface';

@Injectable()
export class ConnectedPlatformsWidget {
  generate(accountsCount: number, accounts: any[] = []): DashboardWidgetData {
    return {
      widgetName: 'ConnectedPlatforms',
      title: 'Connected Social Accounts',
      data: {
        totalConnected: accountsCount,
        accounts,
      },
    };
  }
}
