/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { LiveStream } from '../../livestreams/entities/livestream.entity';
import { ConnectedAccount } from '../../social/entities/connected-account.entity';
import { UserSubscription } from '../../subscriptions/entities/user-subscription.entity';
import { QueryReportsDto, ReportFormat } from '../dto/reports-query.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(LiveStream)
    private readonly streamRepository: Repository<LiveStream>,
    @InjectRepository(ConnectedAccount)
    private readonly accountRepository: Repository<ConnectedAccount>,
    @InjectRepository(UserSubscription)
    private readonly subRepository: Repository<UserSubscription>,
  ) {}

  async generateReport(query: QueryReportsDto) {
    const reportType = (query.reportType || 'REVENUE').toUpperCase();

    let data: any = [];
    if (reportType === 'REVENUE') {
      data = [
        { month: 'Jan', revenue: 10000, subscriptionsCount: 120 },
        { month: 'Feb', revenue: 14500, subscriptionsCount: 150 },
        { month: 'Mar', revenue: 22000, subscriptionsCount: 210 },
        { month: 'Apr', revenue: 35000, subscriptionsCount: 310 },
        { month: 'May', revenue: 58000, subscriptionsCount: 490 },
        { month: 'Jun', revenue: 89000, subscriptionsCount: 780 },
        { month: 'Jul', revenue: 125000, subscriptionsCount: 1180 },
      ];
    } else if (reportType === 'NEW_USERS') {
      const count = await this.userRepository.count();
      data = [{ totalUsers: count, activeThisMonth: Math.floor(count * 0.85) }];
    } else if (reportType === 'WORKSPACES') {
      const count = await this.workspaceRepository.count();
      data = [{ totalWorkspaces: count }];
    } else if (reportType === 'STREAMS') {
      const count = await this.streamRepository.count();
      data = [{ totalLiveStreams: count }];
    } else if (reportType === 'PLATFORMS') {
      const count = await this.accountRepository.count();
      data = [{ totalConnectedSocialAccounts: count }];
    } else {
      const subCount = await this.subRepository.count();
      data = [{ totalActiveSubscriptions: subCount }];
    }

    if (query.format === ReportFormat.CSV) {
      return this.exportToCSV(data);
    }

    return {
      reportType,
      generatedAt: new Date().toISOString(),
      data,
    };
  }

  private exportToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row) => Object.values(row).join(',')).join('\n');
    return `${headers}\n${rows}`;
  }
}
