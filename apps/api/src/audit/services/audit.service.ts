import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminAuditLog } from '../entities/admin-audit-log.entity';
import { CreateAuditLogDto, QueryAuditDto } from '../dto/audit.dto';

const SENSITIVE_KEYS = [
  'password',
  'passwordHash',
  'accessToken',
  'refreshToken',
  'oauthToken',
  'clientSecret',
  'apiKey',
  'streamKey',
  'rtmpSecret',
  'authorization',
  'cookie',
  'sessionToken',
  'cardNumber',
  'cvv',
  'secret',
  'privateKey',
];

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AdminAuditLog)
    private readonly repository: Repository<AdminAuditLog>,
  ) {}

  private sanitizeMetadata(
    metadata?: Record<string, any>,
  ): Record<string, any> | undefined {
    if (!metadata) return undefined;

    // Deep clone and sanitize
    const sanitized = JSON.parse(JSON.stringify(metadata));

    const sanitizeRecursive = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;

      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const lowerKey = key.toLowerCase();

          if (
            SENSITIVE_KEYS.some((sk) => lowerKey.includes(sk.toLowerCase()))
          ) {
            obj[key] = '[REDACTED]';
          } else if (typeof obj[key] === 'object') {
            sanitizeRecursive(obj[key]);
          }
        }
      }
    };

    sanitizeRecursive(sanitized);
    return sanitized;
  }

  async logAction(dto: CreateAuditLogDto): Promise<AdminAuditLog> {
    const sanitizedMetadata = this.sanitizeMetadata(dto.metadata);

    const log = this.repository.create({
      adminUserId: dto.adminUserId,
      action: dto.action,
      module: dto.module || 'SYSTEM',
      targetType: dto.targetType,
      targetId: dto.targetId,
      targetName: dto.targetName,
      metadata: sanitizedMetadata,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      requestId: dto.requestId,
    });
    return this.repository.save(log);
  }

  async getLogs(queryDto: QueryAuditDto): Promise<{
    data: AdminAuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      adminUserId,
      action,
      module: moduleName,
      dateFrom,
      dateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    const page = queryDto.page || 1;
    const limit = queryDto.limit || 25;
    const offset = (page - 1) * limit;

    const query = this.repository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.adminUser', 'adminUser');

    if (adminUserId) {
      query.andWhere('log.adminUserId = :adminUserId', { adminUserId });
    }

    if (action) {
      query.andWhere('log.action = :action', { action });
    }

    if (moduleName) {
      query.andWhere('log.module = :moduleName', { moduleName });
    }

    if (dateFrom) {
      query.andWhere('log.created_at >= :dateFrom', {
        dateFrom: new Date(dateFrom),
      });
    }

    if (dateTo) {
      query.andWhere('log.created_at <= :dateTo', { dateTo: new Date(dateTo) });
    }

    if (search) {
      query.andWhere(
        '(adminUser.email ILIKE :search OR adminUser.firstName ILIKE :search OR adminUser.lastName ILIKE :search OR log.action ILIKE :search OR log.targetName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Map frontend sort keys to database columns securely
    const sortFieldMap: Record<string, string> = {
      createdAt: 'log.created_at',
      created_at: 'log.created_at',
      action: 'log.action',
      module: 'log.module',
    };

    const dbSortField = sortFieldMap[sortBy] || 'log.created_at';
    const dbSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    query.orderBy(dbSortField, dbSortOrder).take(limit).skip(offset);

    const [data, total] = await query.getManyAndCount();

    // Ensure data is sanitized before returning, and supply both createdAt and created_at
    const sanitizedData = data.map((log) => {
      if (log.metadata) log.metadata = this.sanitizeMetadata(log.metadata);
      (log as any).createdAt = log.created_at;
      return log;
    });

    return {
      data: sanitizedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getLogById(id: string): Promise<AdminAuditLog> {
    const log = await this.repository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.adminUser', 'adminUser')
      .where('log.id = :id', { id })
      .getOne();

    if (!log) {
      return null as any;
    }

    if (log.metadata) {
      log.metadata = this.sanitizeMetadata(log.metadata);
    }
    (log as any).createdAt = log.created_at;

    return log;
  }
}
