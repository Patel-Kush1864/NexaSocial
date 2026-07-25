/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { DashboardWidgetData } from '../interfaces/dashboard-summary.interface';

@Injectable()
export class WorkspaceSummaryWidget {
  generate(workspace: any, membersCount: number): DashboardWidgetData {
    return {
      widgetName: 'WorkspaceSummary',
      title: 'Workspace Overview',
      data: {
        id: workspace?.id,
        name: workspace?.name,
        slug: workspace?.slug,
        ownerId: workspace?.owner_id || workspace?.ownerId,
        membersCount,
        createdAt: workspace?.created_at,
      },
    };
  }
}
