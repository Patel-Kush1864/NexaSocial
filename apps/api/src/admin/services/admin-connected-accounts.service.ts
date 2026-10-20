import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConnectedAccount,
  AccountStatus,
} from '../../social/entities/connected-account.entity';
import { ActivityLog } from '../../activity/entities/activity-log.entity';
import { AdminGetConnectedAccountsDto } from '../dto/connected-accounts.dto';

@Injectable()
export class AdminConnectedAccountsService {
  private readonly logger = new Logger(AdminConnectedAccountsService.name);

  constructor(
    @InjectRepository(ConnectedAccount)
    private readonly connectedAccountRepository: Repository<ConnectedAccount>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
  ) {}

  async getConnectedAccounts(query: AdminGetConnectedAccountsDto) {
    const {
      page = 1,
      limit = 20,
      search,
      platform,
      status,
      sortBy,
      sortOrder = 'desc',
    } = query;

    const qb = this.connectedAccountRepository
      .createQueryBuilder('account')
      // Left join workspace and its owner safely. We do NOT select tokens.
      .leftJoinAndSelect('account.workspace', 'workspace')
      .leftJoinAndSelect('workspace.owner', 'owner');

    if (platform) {
      qb.andWhere('account.platformName = :platform', { platform });
    }

    if (status) {
      qb.andWhere('account.status = :status', { status });
    }

    if (search) {
      qb.andWhere(
        '(LOWER(account.name) LIKE LOWER(:search) OR LOWER(workspace.name) LIKE LOWER(:search) OR LOWER(owner.email) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    // White-list sorting
    const validSortFields: Record<string, string> = {
      connectedAt: 'account.created_at',
      createdAt: 'account.created_at',
      updatedAt: 'account.updated_at',
      status: 'account.status',
      platform: 'account.platformName',
    };

    const sortField =
      sortBy && validSortFields[sortBy]
        ? validSortFields[sortBy]
        : 'account.created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    qb.orderBy(sortField, order);
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // Now we fetch aggregate activity logs for these items to get lastSync and error counts.
    // This avoids N+1 queries by fetching it all at once if we have items.
    const accountIds = items.map((a) => a.id);
    let syncLogs: { entity_id: string; last_sync: Date }[] = [];
    let errorLogs: {
      entity_id: string;
      error_count: string;
      last_error: Date;
    }[] = [];

    if (accountIds.length > 0) {
      syncLogs = await this.activityLogRepository
        .createQueryBuilder('log')
        .select('log.entity_id')
        .addSelect('MAX(log.created_at)', 'last_sync')
        .where('log.entity_type = :type', { type: 'CONNECTED_ACCOUNT' })
        .andWhere('log.entity_id IN (:...ids)', { ids: accountIds })
        .andWhere('log.action = :action', { action: 'PROFILE_SYNCED' })
        .groupBy('log.entity_id')
        .getRawMany();

      errorLogs = await this.activityLogRepository
        .createQueryBuilder('log')
        .select('log.entity_id')
        .addSelect('COUNT(log.id)', 'error_count')
        .addSelect('MAX(log.created_at)', 'last_error')
        .where('log.entity_type = :type', { type: 'CONNECTED_ACCOUNT' })
        .andWhere('log.entity_id IN (:...ids)', { ids: accountIds })
        .andWhere('log.action = :action', { action: 'API_ERROR' })
        .groupBy('log.entity_id')
        .getRawMany();
    }

    const syncMap = new Map(
      syncLogs.map((log) => [log.entity_id, log.last_sync]),
    );
    const errorMap = new Map(
      errorLogs.map((log) => [
        log.entity_id,
        {
          count: parseInt(log.error_count, 10),
          lastOccurredAt: log.last_error,
        },
      ]),
    );

    const mappedItems = items.map((account) => {
      // SAFELY MAP REQUIRED FIELDS ONLY.
      // Do NOT return token relations or raw metadata that might contain secrets.
      return {
        id: account.id,
        platform: {
          id: account.platformName.toLowerCase(),
          name: this.formatPlatformName(account.platformName),
          key: account.platformName,
        },
        account: {
          name: account.name,
          username: account.platformUserId
            ? `ID: ****${account.platformUserId.slice(-4)}`
            : undefined, // Masked provider ID as requested
          avatar: account.avatar,
        },
        workspace: account.workspace
          ? {
              id: account.workspace.id,
              name: account.workspace.name,
            }
          : null,
        owner: account.workspace?.owner
          ? {
              id: account.workspace.owner.id,
              name:
                `${account.workspace.owner.firstName || ''} ${account.workspace.owner.lastName || ''}`.trim() ||
                'Unknown User',
              email: account.workspace.owner.email,
            }
          : null,
        status: account.status,
        connectedAt: account.created_at,
        lastSync: syncMap.get(account.id) || null,
        errors: {
          count: errorMap.get(account.id)?.count || 0,
          lastOccurredAt: errorMap.get(account.id)?.lastOccurredAt || null,
        },
      };
    });

    return {
      data: mappedItems,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStatistics() {
    const qb = this.connectedAccountRepository.createQueryBuilder('account');

    // Total accounts
    const total = await qb.getCount();

    // Active accounts
    const active = await qb
      .where('account.status = :status', { status: AccountStatus.CONNECTED })
      .getCount();

    // Expired
    const expired = await qb
      .where('account.status = :status', {
        status: AccountStatus.TOKEN_EXPIRED,
      })
      .getCount();

    // Disconnected
    const disconnected = await qb
      .where('account.status = :status', { status: AccountStatus.DISCONNECTED })
      .getCount();

    // Error
    const error = await qb
      .where('account.status = :status', { status: AccountStatus.ERROR })
      .getCount();

    return {
      total,
      active,
      expired,
      disconnected,
      error,
    };
  }

  async getAccountErrors(id: string, page = 1, limit = 20) {
    const qb = this.activityLogRepository
      .createQueryBuilder('log')
      .where('log.entity_type = :type', { type: 'CONNECTED_ACCOUNT' })
      .andWhere('log.entity_id = :id', { id })
      .andWhere('log.action = :action', { action: 'API_ERROR' })
      .orderBy('log.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    const mappedErrors = items.map((log) => {
      // Note: sanitize potentially sensitive fields in log.description/metadata just in case
      let safeMessage = log.description || 'Unknown error occurred';
      if (
        safeMessage.toLowerCase().includes('bearer') ||
        safeMessage.toLowerCase().includes('token=')
      ) {
        safeMessage = 'Provider API Error (Sensitive Data Redacted)';
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const statusCode = log.metadata?.statusCode || 500;

      return {
        id: log.id,
        type: 'API_ERROR',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        statusCode,
        message: safeMessage,
        severity: 'WARNING',
        occurredAt: log.created_at,
      };
    });

    return {
      data: mappedErrors,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private formatPlatformName(key: string): string {
    const map: Record<string, string> = {
      YOUTUBE: 'YouTube',
      FACEBOOK: 'Facebook',
      INSTAGRAM: 'Instagram',
      LINKEDIN: 'LinkedIn',
      TWITTER: 'X',
      X: 'X',
      TWITCH: 'Twitch',
      TIKTOK: 'TikTok',
    };
    return map[key.toUpperCase()] || key;
  }
}
