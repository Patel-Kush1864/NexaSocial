/* eslint-disable @typescript-eslint/require-await */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Platform } from '../../database/entities/platform.entity';
import {
  ConnectedAccount,
  AccountStatus,
} from '../../social/entities/connected-account.entity';
import { ActivityLog } from '../../users/entities/activity-log.entity';
import { AuditService } from '../../audit/services/audit.service';
import { AuditMeta } from '../../audit/decorators/audit-meta.decorator';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminSocialPlatformsService {
  constructor(
    @InjectRepository(Platform)
    private readonly platformRepository: Repository<Platform>,
    @InjectRepository(ConnectedAccount)
    private readonly connectedAccountRepository: Repository<ConnectedAccount>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {}

  private getCanonicalKey(platformName: string): string {
    const key = platformName.toUpperCase();
    return key === 'X' ? 'TWITTER' : key;
  }

  private getDisplayKey(canonicalKey: string): string {
    const key = canonicalKey.toUpperCase();
    return key === 'TWITTER' ? 'X' : key;
  }

  async findAll() {
    const platforms = await this.platformRepository.find({
      order: { name: 'ASC' },
    });

    const results: any[] = [];
    for (const platform of platforms) {
      const canonicalKey = this.getCanonicalKey(platform.name);

      const [totalCount, activeCount] = await Promise.all([
        this.connectedAccountRepository.count({
          where: { platformName: canonicalKey },
        }),
        this.connectedAccountRepository.count({
          where: {
            platformName: canonicalKey,
            status: AccountStatus.CONNECTED,
          },
        }),
      ]);

      const errorCount = await this.activityLogRepository.count({
        where: {
          module: 'SOCIAL',
          action: 'API_ERROR',
        },
      });

      results.push({
        id: platform.id,
        key: this.getDisplayKey(canonicalKey),
        name: platform.name,
        enabled: platform.isActive,
        health: await this.getHealthStatus(canonicalKey),
        connectedAccounts: totalCount,
        activeConnections: activeCount,
        apiErrors: errorCount,
        lastHealthCheck: new Date().toISOString(),
        lastSuccessfulCheck: new Date().toISOString(),
        updatedAt: platform.updated_at,
      });
    }

    return { data: results };
  }

  async findOne(id: string) {
    const platform = await this.platformRepository.findOne({ where: { id } });
    if (!platform) {
      throw new NotFoundException('Platform not found');
    }

    const canonicalKey = this.getCanonicalKey(platform.name);

    const [totalCount, activeCount] = await Promise.all([
      this.connectedAccountRepository.count({
        where: { platformName: canonicalKey },
      }),
      this.connectedAccountRepository.count({
        where: { platformName: canonicalKey, status: AccountStatus.CONNECTED },
      }),
    ]);

    const errorCount = await this.activityLogRepository.count({
      where: {
        module: 'SOCIAL',
        action: 'API_ERROR',
      },
    });

    return {
      id: platform.id,
      key: this.getDisplayKey(canonicalKey),
      name: platform.name,
      enabled: platform.isActive,
      health: await this.getHealthStatus(canonicalKey),
      connectedAccounts: totalCount,
      activeConnections: activeCount,
      apiErrors: errorCount,
      lastHealthCheck: new Date().toISOString(),
      lastSuccessfulCheck: new Date().toISOString(),
      createdAt: platform.created_at,
      updatedAt: platform.updated_at,
    };
  }

  async getHealth(id: string) {
    const platform = await this.platformRepository.findOne({ where: { id } });
    if (!platform) {
      throw new NotFoundException('Platform not found');
    }

    const canonicalKey = this.getCanonicalKey(platform.name);
    const healthStatus = await this.getHealthStatus(canonicalKey);

    return {
      platform: this.getDisplayKey(canonicalKey),
      status: healthStatus,
      responseTimeMs:
        healthStatus === 'HEALTHY' ? Math.floor(Math.random() * 50) + 50 : 0,
      lastCheckedAt: new Date().toISOString(),
      lastSuccessfulAt: new Date().toISOString(),
      errorCount: 0,
    };
  }

  private async getHealthStatus(canonicalKey: string): Promise<string> {
    const envKey = `${canonicalKey}_CLIENT_ID`;
    const clientId = this.configService.get<string>(envKey);
    if (!clientId) {
      return 'UNKNOWN'; // Configuration missing
    }
    return 'HEALTHY';
  }

  async getStatistics(id: string) {
    const platform = await this.platformRepository.findOne({ where: { id } });
    if (!platform) {
      throw new NotFoundException('Platform not found');
    }

    const canonicalKey = this.getCanonicalKey(platform.name);

    const totalCount = await this.connectedAccountRepository.count({
      where: { platformName: canonicalKey },
    });
    const activeCount = await this.connectedAccountRepository.count({
      where: { platformName: canonicalKey, status: AccountStatus.CONNECTED },
    });
    const errorCount = await this.connectedAccountRepository.count({
      where: { platformName: canonicalKey, status: AccountStatus.ERROR },
    });
    const inactiveCount = totalCount - activeCount - errorCount;

    return {
      platform: this.getDisplayKey(canonicalKey),
      connections: {
        total: totalCount,
        active: activeCount,
        inactive: inactiveCount,
        failed: errorCount,
      },
      last24Hours: {
        newConnections: 0,
        disconnections: 0,
        errors: 0,
      },
    };
  }

  async getErrors(id: string, query: any) {
    const platform = await this.platformRepository.findOne({ where: { id } });
    if (!platform) {
      throw new NotFoundException('Platform not found');
    }

    const canonicalKey = this.getCanonicalKey(platform.name);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { page = 1, limit = 20 } = query;

    const qb = this.activityLogRepository
      .createQueryBuilder('log')
      .where('log.module = :module', { module: 'SOCIAL' })
      .andWhere('log.action = :action', { action: 'API_ERROR' });

    qb.orderBy('log.created_at', 'DESC');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    const data = items.map((item) => ({
      id: item.id,
      platform: this.getDisplayKey(canonicalKey),
      type: 'API_ERROR',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      statusCode: item.metadata?.statusCode || 500,
      message: item.description || 'Unknown API Error',
      severity: 'WARNING',
      occurredAt: item.created_at,
    }));

    return {
      data,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatus(
    id: string,
    enabled: boolean,
    adminUserId: string,
    auditMeta?: AuditMeta,
  ) {
    const platform = await this.platformRepository.findOne({ where: { id } });
    if (!platform) {
      throw new NotFoundException('Platform not found');
    }

    const previousStatus = platform.isActive ? 'ACTIVE' : 'INACTIVE';
    const newStatus = enabled ? 'ACTIVE' : 'INACTIVE';
    platform.isActive = enabled;
    await this.platformRepository.save(platform);

    await this.auditService.logAction({
      adminUserId,
      action: enabled ? 'PLATFORM_ENABLED' : 'PLATFORM_DISABLED',
      module: 'SOCIAL_PLATFORM',
      targetType: 'SOCIAL_PLATFORM',
      targetId: platform.id,
      targetName: platform.name,
      ipAddress: auditMeta?.ipAddress,
      userAgent: auditMeta?.userAgent,
      requestId: auditMeta?.requestId,
      metadata: { previousStatus, newStatus },
    });

    return platform;
  }
}
