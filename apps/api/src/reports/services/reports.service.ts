/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { LiveStream } from '../../livestreams/entities/livestream.entity';
import { ConnectedAccount } from '../../social/entities/connected-account.entity';
import { UserSubscription } from '../../subscriptions/entities/user-subscription.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { QueryReportsDto, ReportFormat } from '../dto/reports-query.dto';
import { generateCSV } from '../utils/csv.utils';

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
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async generateReport(query: QueryReportsDto) {
    const reportType = (query.reportType || 'USERS').toUpperCase();

    let result;
    switch (reportType) {
      case 'USERS':
        result = await this.getUsersReport(query);
        break;
      case 'WORKSPACES':
        result = await this.getWorkspacesReport(query);
        break;
      case 'SUBSCRIPTIONS':
        result = await this.getSubscriptionsReport(query);
        break;
      case 'REVENUE':
        result = await this.getRevenueReport(query);
        break;
      case 'PAYMENTS':
        result = await this.getPaymentsReport(query);
        break;
      case 'LIVE_STREAMS':
        result = await this.getLiveStreamsReport(query);
        break;
      case 'SOCIAL_PLATFORMS':
        result = await this.getSocialPlatformsReport(query);
        break;
      default:
        throw new BadRequestException(`Invalid report type: ${reportType}`);
    }

    if (query.format === ReportFormat.CSV) {
      return this.exportToCSV(reportType, result.rows);
    }

    return {
      reportType,
      generatedAt: new Date().toISOString(),
      ...result,
    };
  }

  private applyDateFilter<T extends import('typeorm').ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    alias: string,
    column: string,
    query: QueryReportsDto,
  ) {
    if (query.dateFrom) {
      const from = new Date(query.dateFrom);
      qb.andWhere(`${alias}.${column} >= :dateFrom`, {
        dateFrom: from,
      });
    }
    if (query.dateTo) {
      const to = new Date(query.dateTo);
      // Ensure dateTo covers the end of the day so current day records are never cut off
      to.setHours(23, 59, 59, 999);
      qb.andWhere(`${alias}.${column} <= :dateTo`, {
        dateTo: to,
      });
    }
  }

  private applyPagination<T extends import('typeorm').ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    query: QueryReportsDto,
  ) {
    const limit = query.limit || 25;
    const page = query.page || 1;
    qb.skip((page - 1) * limit).take(limit);
  }

  private async getUsersReport(query: QueryReportsDto) {
    const qb = this.userRepository.createQueryBuilder('user');

    this.applyDateFilter(qb, 'user', 'created_at', query);

    if (query.status) {
      qb.andWhere('user.status = :status', { status: query.status });
    }
    if (query.workspaceId) {
      qb.andWhere(
        'user.id IN (SELECT user_id FROM workspace_members WHERE workspace_id = :workspaceId)',
        { workspaceId: query.workspaceId },
      );
    }
    if (query.search) {
      qb.andWhere(
        '(LOWER(user.email) LIKE LOWER(:search) OR LOWER(user.first_name) LIKE LOWER(:search) OR LOWER(user.last_name) LIKE LOWER(:search))',
        { search: `%${query.search}%` },
      );
    }

    // Summary metrics (ignoring pagination for totals)
    const summaryQb = qb.clone();
    const total = await summaryQb.getCount();

    const activeCount = await summaryQb
      .clone()
      .andWhere('(user.status = :activeStatus OR user.is_active = true)', { activeStatus: 'ACTIVE' })
      .getCount();

    // Sorting and Pagination
    const sortBy = [
      'createdAt',
      'firstName',
      'lastName',
      'email',
      'status',
    ].includes(query.sortBy || '')
      ? `user.${query.sortBy === 'createdAt' ? 'created_at' : (query.sortBy || '').replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)}`
      : 'user.created_at';
    qb.orderBy(sortBy, query.sortOrder || 'DESC');
    this.applyPagination(qb, query);

    const [users, count] = await qb.getManyAndCount();

    const rows = users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      status: u.status || (u.isActive ? 'ACTIVE' : 'INACTIVE'),
      createdAt: u.created_at,
    }));

    // Format for charting (Users grouped by day/month based on dateFrom/dateTo)
    const chartData = await this.buildTimeSeriesChart(
      this.userRepository,
      'created_at',
      query,
    );

    return {
      summary: { total, activeCount },
      chart: chartData,
      rows,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 25,
        total: count,
        totalPages: Math.ceil(count / (query.limit || 25)),
      },
    };
  }

  private async getWorkspacesReport(query: QueryReportsDto) {
    const qb = this.workspaceRepository
      .createQueryBuilder('workspace')
      .leftJoinAndSelect('workspace.owner', 'owner');

    this.applyDateFilter(qb, 'workspace', 'created_at', query);

    if (query.search) {
      qb.andWhere('(LOWER(workspace.name) LIKE LOWER(:search))', {
        search: `%${query.search}%`,
      });
    }

    const total = await qb.getCount();

    const sortBy =
      query.sortBy === 'name' ? 'workspace.name' : 'workspace.created_at';
    qb.orderBy(sortBy, query.sortOrder || 'DESC');
    this.applyPagination(qb, query);

    const [workspaces, count] = await qb.getManyAndCount();

    const rows = workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      ownerEmail: w.owner?.email,
      ownerName:
        `${w.owner?.firstName || ''} ${w.owner?.lastName || ''}`.trim() || 'Owner',
      memberCount: 1,
      createdAt: w.created_at,
    }));

    const chartData = await this.buildTimeSeriesChart(
      this.workspaceRepository,
      'created_at',
      query,
    );

    return {
      summary: { total },
      chart: chartData,
      rows,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 25,
        total: count,
        totalPages: Math.ceil(count / (query.limit || 25)),
      },
    };
  }

  private async getSubscriptionsReport(query: QueryReportsDto) {
    const qb = this.subRepository
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.plan', 'plan')
      .leftJoinAndSelect('sub.user', 'user');

    this.applyDateFilter(qb, 'sub', 'created_at', query);

    if (query.status)
      qb.andWhere('sub.status = :status', { status: query.status });
    if (query.planId)
      qb.andWhere('sub.plan_id = :planId', { planId: query.planId });
    if (query.workspaceId)
      qb.andWhere(
        'sub.user_id IN (SELECT user_id FROM workspace_members WHERE workspace_id = :workspaceId)',
        { workspaceId: query.workspaceId },
      );

    const total = await qb.getCount();
    const activeCount = await qb
      .clone()
      .andWhere('sub.status = :statusActive', { statusActive: 'ACTIVE' })
      .getCount();

    qb.orderBy('sub.created_at', query.sortOrder || 'DESC');
    this.applyPagination(qb, query);

    const [subs, count] = await qb.getManyAndCount();

    const rows = subs.map((s) => ({
      id: s.id,
      status: s.status,
      planName: s.plan?.name,
      userEmail: s.user?.email,
      userName: `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.trim() || 'User',
      createdAt: s.created_at,
    }));

    const chartData = await this.buildTimeSeriesChart(
      this.subRepository,
      'created_at',
      query,
    );

    return {
      summary: { total, activeCount },
      chart: chartData,
      rows,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 25,
        total: count,
        totalPages: Math.ceil(count / (query.limit || 25)),
      },
    };
  }

  private async getRevenueReport(query: QueryReportsDto) {
    const qb = this.paymentRepository.createQueryBuilder('payment');

    // Only successful payments for revenue
    qb.where('payment.status = :status', { status: 'SUCCESS' });
    this.applyDateFilter(qb, 'payment', 'created_at', query);

    if (query.currency)
      qb.andWhere('payment.currency = :currency', { currency: query.currency });
    if (query.workspaceId)
      qb.andWhere(
        'payment.user_id IN (SELECT user_id FROM workspace_members WHERE workspace_id = :workspaceId)',
        { workspaceId: query.workspaceId },
      );

    // Aggregate revenue by currency
    const revenueByCurrency = await qb
      .clone()
      .select('payment.currency', 'currency')
      .addSelect('SUM(payment.amount)', 'grossRevenue')
      .addSelect('SUM(payment.refunded_amount)', 'refunds')
      .groupBy('payment.currency')
      .getRawMany();

    const summary = revenueByCurrency.map((r) => ({
      currency: r.currency,
      grossRevenue: parseFloat(r.grossRevenue || '0'),
      refunds: parseFloat(r.refunds || '0'),
      netRevenue:
        parseFloat(r.grossRevenue || '0') - parseFloat(r.refunds || '0'),
    }));

    // Time series revenue
    const chartQb = qb
      .clone()
      .select('DATE(payment.created_at)', 'date')
      .addSelect('payment.currency', 'currency')
      .addSelect('SUM(payment.amount - payment.refunded_amount)', 'netRevenue')
      .groupBy('DATE(payment.created_at)')
      .addGroupBy('payment.currency')
      .orderBy('DATE(payment.created_at)', 'ASC');

    const rawChart = await chartQb.getRawMany();

    const formatDate = (val: any) => {
      if (!val) return '';
      if (val instanceof Date) return val.toISOString().split('T')[0];
      return String(val);
    };

    const chartData = {
      labels: [...new Set(rawChart.map((r) => formatDate(r.date)))],
      series: [] as { name: string; data: number[] }[],
    };

    const currencies = [...new Set(rawChart.map((r) => r.currency))];
    currencies.forEach((currency) => {
      const dataPoints = chartData.labels.map((date) => {
        const record = rawChart.find(
          (r) => formatDate(r.date) === date && r.currency === currency,
        );
        return record ? parseFloat(record.netRevenue) : 0;
      });
      chartData.series.push({
        name: `Net Revenue (${currency})`,
        data: dataPoints,
      });
    });

    // Rows for table
    const tableQb = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.user', 'user')
      .leftJoinAndSelect('payment.plan', 'plan')
      .where('payment.status = :status', { status: 'SUCCESS' });

    this.applyDateFilter(tableQb, 'payment', 'created_at', query);
    if (query.currency)
      tableQb.andWhere('payment.currency = :currency', {
        currency: query.currency,
      });

    tableQb.orderBy('payment.created_at', query.sortOrder || 'DESC');
    this.applyPagination(tableQb, query);

    const [payments, count] = await tableQb.getManyAndCount();

    const rows = payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      refundedAmount: p.refundedAmount,
      netAmount: Number(p.amount) - Number(p.refundedAmount || 0),
      currency: p.currency,
      gateway: p.gateway,
      userEmail: p.user?.email,
      planName: p.plan?.name,
      createdAt: p.created_at,
    }));

    return {
      summary: { revenueByCurrency: summary },
      chart: chartData,
      rows,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 25,
        total: count,
        totalPages: Math.ceil(count / (query.limit || 25)),
      },
    };
  }

  private async getPaymentsReport(query: QueryReportsDto) {
    const qb = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.user', 'user')
      .leftJoinAndSelect('payment.plan', 'plan');

    this.applyDateFilter(qb, 'payment', 'created_at', query);

    if (query.status)
      qb.andWhere('payment.status = :status', { status: query.status });
    if (query.currency)
      qb.andWhere('payment.currency = :currency', { currency: query.currency });
    if (query.search) {
      qb.andWhere(
        '(LOWER(payment.id) LIKE LOWER(:search) OR LOWER(payment.gateway_payment_id) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search))',
        { search: `%${query.search}%` },
      );
    }

    const total = await qb.getCount();

    const statusCounts = await qb
      .clone()
      .select('payment.status', 'status')
      .addSelect('COUNT(payment.id)', 'count')
      .groupBy('payment.status')
      .getRawMany();

    const summary = {
      total,
      success: parseInt(
        statusCounts.find((s) => s.status === 'SUCCESS')?.count || '0',
        10,
      ),
      failed: parseInt(
        statusCounts.find((s) => s.status === 'FAILED')?.count || '0',
        10,
      ),
      refunded: parseInt(
        statusCounts.find((s) => s.status === 'REFUNDED')?.count || '0',
        10,
      ),
    };

    qb.orderBy('payment.created_at', query.sortOrder || 'DESC');
    this.applyPagination(qb, query);

    const [payments, count] = await qb.getManyAndCount();

    const rows = payments.map((p) => ({
      id: p.id,
      status: p.status,
      amount: p.amount,
      currency: p.currency,
      gateway: p.gateway,
      gatewayPaymentId: p.gatewayPaymentId,
      userEmail: p.user?.email,
      planName: p.plan?.name,
      createdAt: p.created_at,
    }));

    const chartData = await this.buildTimeSeriesChart(
      this.paymentRepository,
      'created_at',
      query,
    );

    return {
      summary,
      chart: chartData,
      rows,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 25,
        total: count,
        totalPages: Math.ceil(count / (query.limit || 25)),
      },
    };
  }

  private async getLiveStreamsReport(query: QueryReportsDto) {
    const qb = this.streamRepository
      .createQueryBuilder('stream')
      .leftJoinAndSelect('stream.workspace', 'workspace')
      .leftJoinAndSelect('stream.platforms', 'platforms');

    this.applyDateFilter(qb, 'stream', 'created_at', query);

    if (query.status)
      qb.andWhere('stream.status = :status', { status: query.status });
    if (query.workspaceId)
      qb.andWhere('stream.workspace_id = :workspaceId', {
        workspaceId: query.workspaceId,
      });
    if (query.search)
      qb.andWhere('LOWER(stream.title) LIKE LOWER(:search)', {
        search: `%${query.search}%`,
      });

    const total = await qb.getCount();
    const liveCount = await qb
      .clone()
      .andWhere('stream.status = :status', { status: 'LIVE' })
      .getCount();
    const scheduledCount = await qb
      .clone()
      .andWhere('stream.status = :status', { status: 'SCHEDULED' })
      .getCount();

    qb.orderBy('stream.created_at', query.sortOrder || 'DESC');
    this.applyPagination(qb, query);

    const [streams, count] = await qb.getManyAndCount();

    const rows = streams.map((s) => ({
      id: s.id,
      title: s.title,
      status: s.status,
      workspaceName: s.workspace?.name,
      platformCount: s.platforms?.length || 0,
      scheduledAt: s.scheduledAt,
      startedAt: s.startedAt,
      createdAt: s.created_at,
    }));

    const chartData = await this.buildTimeSeriesChart(
      this.streamRepository,
      'created_at',
      query,
    );

    return {
      summary: { total, liveCount, scheduledCount },
      chart: chartData,
      rows,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 25,
        total: count,
        totalPages: Math.ceil(count / (query.limit || 25)),
      },
    };
  }

  private async getSocialPlatformsReport(query: QueryReportsDto) {
    const qb = this.accountRepository
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.workspace', 'workspace');

    this.applyDateFilter(qb, 'account', 'created_at', query);

    if (query.platform)
      qb.andWhere('account.platformName = :platform', { platform: query.platform });
    if (query.workspaceId)
      qb.andWhere('account.workspace_id = :workspaceId', {
        workspaceId: query.workspaceId,
      });

    const total = await qb.getCount();

    const platformCounts = await qb
      .clone()
      .select('account.platformName', 'platform')
      .addSelect('COUNT(account.id)', 'count')
      .groupBy('account.platformName')
      .getRawMany();

    const chartData = {
      labels: platformCounts.map((p) => p.platform),
      series: [
        {
          name: 'Connections',
          data: platformCounts.map((p) => parseInt(p.count, 10)),
        },
      ],
    };

    qb.orderBy('account.created_at', query.sortOrder || 'DESC');
    this.applyPagination(qb, query);

    const [accounts, count] = await qb.getManyAndCount();

    const rows = accounts.map((a) => ({
      id: a.id,
      platform: a.platformName,
      username: a.name || a.platformName,
      status: a.status,
      workspaceName: a.workspace?.name,
      createdAt: a.created_at,
    }));

    return {
      summary: { total },
      chart: chartData,
      rows,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 25,
        total: count,
        totalPages: Math.ceil(count / (query.limit || 25)),
      },
    };
  }

  private async buildTimeSeriesChart(
    repository: Repository<any>,
    dateColumn: string,
    query: QueryReportsDto,
  ) {
    const qb = repository.createQueryBuilder('entity');
    this.applyDateFilter(qb, 'entity', dateColumn, query);

    const rawData = await qb
      .select(`DATE(entity.${dateColumn})`, 'date')
      .addSelect('COUNT(entity.id)', 'count')
      .groupBy(`DATE(entity.${dateColumn})`)
      .orderBy(`DATE(entity.${dateColumn})`, 'ASC')
      .getRawMany();

    return {
      labels: rawData.map((r) => {
        if (!r.date) return '';
        if (r.date instanceof Date) {
          return r.date.toISOString().split('T')[0];
        }
        return String(r.date);
      }),
      series: [
        {
          name: 'Count',
          data: rawData.map((r) => parseInt(r.count, 10)),
        },
      ],
    };
  }

  private exportToCSV(reportType: string, rows: any[]): string {
    if (!rows || rows.length === 0) return '';

    let headers: string[] = [];
    let keyMap: string[] = [];

    switch (reportType) {
      case 'USERS':
        headers = [
          'ID',
          'Email',
          'First Name',
          'Last Name',
          'Status',
          'Created At',
        ];
        keyMap = [
          'id',
          'email',
          'firstName',
          'lastName',
          'status',
          'createdAt',
        ];
        break;
      case 'WORKSPACES':
        headers = [
          'ID',
          'Name',
          'Owner Email',
          'Owner Name',
          'Member Count',
          'Created At',
        ];
        keyMap = [
          'id',
          'name',
          'ownerEmail',
          'ownerName',
          'memberCount',
          'createdAt',
        ];
        break;
      case 'SUBSCRIPTIONS':
        headers = [
          'ID',
          'Status',
          'Plan Name',
          'Workspace Name',
          'User Email',
          'Start Date',
          'End Date',
          'Created At',
        ];
        keyMap = [
          'id',
          'status',
          'planName',
          'workspaceName',
          'userEmail',
          'startDate',
          'endDate',
          'createdAt',
        ];
        break;
      case 'REVENUE':
        headers = [
          'Payment ID',
          'Gross Amount',
          'Refunded Amount',
          'Net Amount',
          'Currency',
          'Gateway',
          'User Email',
          'Plan Name',
          'Created At',
        ];
        keyMap = [
          'id',
          'amount',
          'refundedAmount',
          'netAmount',
          'currency',
          'gateway',
          'userEmail',
          'planName',
          'createdAt',
        ];
        break;
      case 'PAYMENTS':
        headers = [
          'Payment ID',
          'Status',
          'Amount',
          'Currency',
          'Gateway',
          'Gateway Payment ID',
          'User Email',
          'Plan Name',
          'Created At',
        ];
        keyMap = [
          'id',
          'status',
          'amount',
          'currency',
          'gateway',
          'gatewayPaymentId',
          'userEmail',
          'planName',
          'createdAt',
        ];
        break;
      case 'LIVE_STREAMS':
        headers = [
          'Stream ID',
          'Title',
          'Status',
          'Workspace Name',
          'Platform Count',
          'Scheduled At',
          'Started At',
          'Created At',
        ];
        keyMap = [
          'id',
          'title',
          'status',
          'workspaceName',
          'platformCount',
          'scheduledAt',
          'startedAt',
          'createdAt',
        ];
        break;
      case 'SOCIAL_PLATFORMS':
        headers = [
          'Account ID',
          'Platform',
          'Username',
          'Workspace Name',
          'Status',
          'Created At',
        ];
        keyMap = [
          'id',
          'platform',
          'username',
          'workspaceName',
          'status',
          'createdAt',
        ];
        break;
      default:
        headers = Object.keys(rows[0] || {});
        keyMap = headers;
    }

    return generateCSV(headers, rows, keyMap);
  }
}
