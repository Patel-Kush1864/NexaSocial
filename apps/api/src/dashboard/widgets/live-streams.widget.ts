/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { DashboardWidgetData } from '../interfaces/dashboard-summary.interface';

@Injectable()
export class LiveStreamsWidget {
  generate(
    stats: any,
    activeStreams: any[] = [],
    scheduledStreams: any[] = [],
  ): DashboardWidgetData {
    return {
      widgetName: 'LiveStreams',
      title: 'Live Streams Overview',
      data: {
        stats: {
          scheduled: stats.scheduled || 0,
          live: stats.live || 0,
          completed: stats.completed || 0,
          failed: stats.failed || 0,
        },
        activeStreams,
        scheduledStreams,
      },
    };
  }
}
