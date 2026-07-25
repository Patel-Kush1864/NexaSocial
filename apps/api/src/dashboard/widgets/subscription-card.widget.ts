/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { DashboardWidgetData } from '../interfaces/dashboard-summary.interface';

@Injectable()
export class SubscriptionCardWidget {
  generate(subscription: any): DashboardWidgetData {
    return {
      widgetName: 'SubscriptionCard',
      title: 'Subscription & Plan',
      data: {
        planName: subscription?.plan?.name || 'Free',
        status: subscription?.status || 'ACTIVE',
        currentPeriodEnd: subscription?.currentPeriodEnd,
        features: subscription?.plan?.features || {},
      },
    };
  }
}
