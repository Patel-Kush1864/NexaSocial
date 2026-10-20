/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LiveStream,
  StreamStatus,
} from '../../livestreams/entities/livestream.entity';
import { ActivityLog } from '../../activity/entities/activity-log.entity';
import { User } from '../../users/entities/user.entity';
import { AdminGetLiveStreamsDto } from '../dto/live-streams.dto';

@Injectable()
export class AdminLiveStreamsService {
  private readonly logger = new Logger(AdminLiveStreamsService.name);

  constructor(
    @InjectRepository(LiveStream)
    private readonly liveStreamRepository: Repository<LiveStream>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
  ) {}

  async getLiveStreams(query: AdminGetLiveStreamsDto) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      platform,
      workspaceId,
      creatorId,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder = 'desc',
    } = query;

    const qb = this.liveStreamRepository
      .createQueryBuilder('stream')
      .leftJoinAndSelect('stream.workspace', 'workspace')
      .leftJoinAndSelect('stream.platforms', 'platforms')
      .leftJoinAndSelect('platforms.connectedAccount', 'connectedAccount')
      // Note: Since User is not formally mapped as a ManyToOne relation on LiveStream (createdBy is just a string),
      // we perform a manual join here.
      .leftJoinAndMapOne(
        'stream.creator',
        User,
        'creator',
        'stream.createdBy = creator.id',
      );

    if (status) {
      qb.andWhere('stream.status = :status', { status });
    }

    if (platform) {
      // Filter streams that have at least one platform matching the query
      qb.andWhere('connectedAccount.platformName = :platform', { platform });
    }

    if (workspaceId) {
      qb.andWhere('stream.workspaceId = :workspaceId', { workspaceId });
    }

    if (creatorId) {
      qb.andWhere('stream.createdBy = :creatorId', { creatorId });
    }

    if (dateFrom) {
      qb.andWhere('stream.created_at >= :dateFrom', {
        dateFrom: new Date(dateFrom),
      });
    }

    if (dateTo) {
      qb.andWhere('stream.created_at <= :dateTo', { dateTo: new Date(dateTo) });
    }

    if (search) {
      qb.andWhere(
        '(LOWER(stream.title) LIKE LOWER(:search) OR LOWER(workspace.name) LIKE LOWER(:search) OR LOWER(creator.email) LIKE LOWER(:search) OR LOWER(creator.first_name) LIKE LOWER(:search) OR LOWER(creator.last_name) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    const validSortFields: Record<string, string> = {
      title: 'stream.title',
      status: 'stream.status',
      workspace: 'workspace.name',
      scheduledAt: 'stream.scheduledAt',
      startedAt: 'stream.startedAt',
      endedAt: 'stream.endedAt',
      createdAt: 'stream.created_at',
      updatedAt: 'stream.updated_at',
    };

    const sortField =
      sortBy && validSortFields[sortBy]
        ? validSortFields[sortBy]
        : 'stream.created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    qb.orderBy(sortField, order);
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    const streamIds = items.map((s) => s.id);
    let errorLogs: {
      entity_id: string;
      error_count: string;
      last_error: Date;
    }[] = [];

    if (streamIds.length > 0) {
      errorLogs = await this.activityLogRepository
        .createQueryBuilder('log')
        .select('log.entity_id')
        .addSelect('COUNT(log.id)', 'error_count')
        .addSelect('MAX(log.created_at)', 'last_error')
        .where('log.entity_type = :type', { type: 'LIVE_STREAM' })
        .andWhere('log.entity_id IN (:...ids)', { ids: streamIds })
        // Assuming STREAM_ERROR or API_ERROR
        .andWhere('log.action IN (:...actions)', {
          actions: ['STREAM_ERROR', 'API_ERROR'],
        })
        .groupBy('log.entity_id')
        .getRawMany();
    }

    const errorMap = new Map(
      errorLogs.map((log) => [
        log.entity_id,
        {
          count: parseInt(log.error_count, 10),
          lastOccurredAt: log.last_error,
        },
      ]),
    );

    type LiveStreamWithCreator = LiveStream & { creator?: User };

    const mappedItems = items.map((stream: LiveStreamWithCreator) => {
      // Safe mapping without exposing tokens or stream keys
      const platforms = (stream.platforms || []).map((p) => ({
        id: p.id,
        platformName: p.connectedAccount?.platformName || 'Unknown',
        status: p.status,
      }));

      // Deduplicate platforms for display
      const uniquePlatformNames = Array.from(
        new Set(platforms.map((p) => p.platformName)),
      );
      const platformDisplay = uniquePlatformNames.map((name: string) => ({
        id: name.toLowerCase(),
        name: this.formatPlatformName(name),
        key: name,
      }));

      return {
        id: stream.id,
        title: stream.title,
        description: stream.description,
        status: stream.status,
        visibility: stream.visibility,
        platforms: platformDisplay,
        platformDetails: platforms, // Safe metadata only
        workspace: stream.workspace
          ? {
              id: stream.workspace.id,
              name: stream.workspace.name,
            }
          : null,
        creator: stream.creator
          ? {
              id: stream.creator.id,
              name:
                `${stream.creator.firstName || ''} ${stream.creator.lastName || ''}`.trim() ||
                'Unknown User',
              email: stream.creator.email,
            }
          : null,
        scheduledAt: stream.scheduledAt,
        startedAt: stream.startedAt,
        endedAt: stream.endedAt,
        createdAt: stream.created_at,
        errors: {
          count: errorMap.get(stream.id)?.count || 0,
          lastOccurredAt: errorMap.get(stream.id)?.lastOccurredAt || null,
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
    const qb = this.liveStreamRepository.createQueryBuilder('stream');

    const total = await qb.getCount();

    const live = await qb
      .where('stream.status = :status', { status: StreamStatus.LIVE })
      .getCount();
    const scheduled = await qb
      .where('stream.status = :status', { status: StreamStatus.SCHEDULED })
      .getCount();
    const ended = await qb
      .where('stream.status = :status', { status: StreamStatus.ENDED })
      .getCount();
    const failed = await qb
      .where('stream.status = :status', { status: StreamStatus.FAILED })
      .getCount();
    const cancelled = await qb
      .where('stream.status = :status', { status: StreamStatus.CANCELLED })
      .getCount();
    const draft = await qb
      .where('stream.status = :status', { status: StreamStatus.DRAFT })
      .getCount();

    return {
      total,
      live,
      scheduled,
      ended,
      failed,
      cancelled,
      draft,
    };
  }

  async getStreamErrors(id: string, page = 1, limit = 20) {
    const qb = this.activityLogRepository
      .createQueryBuilder('log')
      .where('log.entity_type = :type', { type: 'LIVE_STREAM' })
      .andWhere('log.entity_id = :id', { id })
      .andWhere('log.action IN (:...actions)', {
        actions: ['STREAM_ERROR', 'API_ERROR'],
      })
      .orderBy('log.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    const mappedErrors = items.map((log) => {
      let safeMessage = log.description || 'Unknown error occurred';
      if (
        safeMessage.toLowerCase().includes('bearer') ||
        safeMessage.toLowerCase().includes('token=')
      ) {
        safeMessage = 'Provider API Error (Sensitive Data Redacted)';
      }

      const statusCode = log.metadata?.statusCode || 500;

      return {
        id: log.id,
        type: log.action,
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
    return map[key?.toUpperCase()] || key;
  }
}
