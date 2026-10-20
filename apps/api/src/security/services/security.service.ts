import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { SecurityEvent } from '../entities/security-event.entity';
import { UserSession } from '../../users/entities/user-session.entity';
import { QuerySecurityDto } from '../dto/security-query.dto';
import { AuditService } from '../../audit/services/audit.service';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(
    @InjectRepository(SecurityEvent)
    private readonly securityEventRepo: Repository<SecurityEvent>,
    @InjectRepository(UserSession)
    private readonly userSessionRepo: Repository<UserSession>,
    private readonly auditService: AuditService,
  ) {}

  async logEvent(
    event: string,
    severity: string,
    data: {
      userEmail?: string;
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
      metadata?: Record<string, any>;
    },
  ) {
    const securityEvent = this.securityEventRepo.create({
      event,
      severity,
      ...data,
    });
    await this.securityEventRepo.save(securityEvent);
  }

  @OnEvent('security.login.failed')
  async handleLoginFailed(payload: {
    email: string;
    ipAddress?: string;
    userAgent?: string;
    reason?: string;
  }) {
    await this.logEvent('LOGIN_FAILED', 'MEDIUM', {
      userEmail: payload.email,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
      metadata: { reason: payload.reason },
    });
  }

  @OnEvent('security.login.success')
  async handleLoginSuccess(payload: {
    user: User;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // Only log if they are platform admins
    const roleName = payload.user.role?.name;
    if (['SUPER_ADMIN', 'ADMIN'].includes(roleName || '')) {
      await this.logEvent('LOGIN_SUCCESS', 'INFO', {
        userEmail: payload.user.email,
        userId: payload.user.id,
        ipAddress: payload.ipAddress,
        userAgent: payload.userAgent,
        metadata: { role: roleName },
      });
    }
  }

  async getSummary() {
    const [
      adminLogins,
      failedLogins,
      activeSessions,
      suspiciousActivity,
      privilegedActions,
      securityEvents,
    ] = await Promise.all([
      this.securityEventRepo.count({ where: { event: 'LOGIN_SUCCESS' } }),
      this.securityEventRepo.count({ where: { event: 'LOGIN_FAILED' } }),
      this.userSessionRepo
        .createQueryBuilder('session')
        .where('session.expiresAt > :now', { now: new Date() })
        .getCount(),
      this.securityEventRepo.count({ where: { event: 'SUSPICIOUS_ACTIVITY' } }),
      this.auditService.getLogs({ limit: 1 }).then((res) => res.total), // reusing audit count
      this.securityEventRepo.count(),
    ]);

    return {
      adminLogins,
      failedLogins,
      activeSessions,
      suspiciousActivity,
      privilegedActions,
      securityEvents,
    };
  }

  async getAdminLogins(query: QuerySecurityDto) {
    return this.queryEvents(query, 'LOGIN_SUCCESS');
  }

  async getFailedLogins(query: QuerySecurityDto) {
    return this.queryEvents(query, 'LOGIN_FAILED');
  }

  async getSuspiciousActivity(query: QuerySecurityDto) {
    return this.queryEvents(query, 'SUSPICIOUS_ACTIVITY');
  }

  async getSecurityEvents(query: QuerySecurityDto) {
    return this.queryEvents(query);
  }

  async getActiveSessions(query: QuerySecurityDto) {
    const limit = Math.min(query.limit || 15, 100);
    const page = Math.max(query.page || 1, 1);
    const offset = (page - 1) * limit;

    const qb = this.userSessionRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .leftJoinAndSelect('user.role', 'role')
      .where('session.expiresAt > :now', { now: new Date() });

    if (query.search) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where('user.email LIKE :search', { search: `%${query.search}%` })
            .orWhere('user.firstName LIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('user.lastName LIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('session.ipAddress LIKE :search', {
              search: `%${query.search}%`,
            });
        }),
      );
    }

    const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    const sortBy = ['created_at', 'expiresAt'].includes(query.sortBy || '')
      ? query.sortBy
      : 'created_at';

    qb.orderBy(`session.${sortBy}`, sortOrder);

    const [sessions, total] = await qb
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    const data = sessions.map((session) => ({
      id: session.id,
      user: {
        id: session.user?.id,
        email: session.user?.email,
        name: `${session.user?.firstName || ''} ${session.user?.lastName || ''}`.trim(),
        role: session.user?.role?.name || 'UNKNOWN',
      },
      ipAddress: session.ipAddress,
      userAgent: session.browser,
      device: session.device,
      createdAt: session.created_at,
      expiresAt: session.expiresAt,
      status: 'ACTIVE',
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPrivilegedActions(query: QuerySecurityDto) {
    // Wrap around existing audit logs API
    return this.auditService.getLogs(query);
  }

  private async queryEvents(query: QuerySecurityDto, fixedEvent?: string) {
    const limit = Math.min(query.limit || 15, 100);
    const page = Math.max(query.page || 1, 1);
    const offset = (page - 1) * limit;

    const qb = this.securityEventRepo.createQueryBuilder('event');

    if (fixedEvent) {
      qb.andWhere('event.event = :fixedEvent', { fixedEvent });
    }

    if (query.action) {
      qb.andWhere('event.event = :action', { action: query.action });
    }

    if (query.severity) {
      qb.andWhere('event.severity = :severity', { severity: query.severity });
    }

    if (query.search) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where('event.userEmail LIKE :search', {
            search: `%${query.search}%`,
          })
            .orWhere('event.ipAddress LIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('event.event LIKE :search', {
              search: `%${query.search}%`,
            });
        }),
      );
    }

    if (query.dateFrom) {
      qb.andWhere('event.created_at >= :dateFrom', {
        dateFrom: new Date(query.dateFrom),
      });
    }

    if (query.dateTo) {
      qb.andWhere('event.created_at <= :dateTo', {
        dateTo: new Date(query.dateTo),
      });
    }

    const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    const sortBy = ['created_at', 'severity'].includes(query.sortBy || '')
      ? query.sortBy
      : 'created_at';

    qb.orderBy(`event.${sortBy}`, sortOrder);

    const [events, total] = await qb.skip(offset).take(limit).getManyAndCount();

    // Sanitize metadata to be safe
    const sanitizeMetadata = (metadata: any): any => {
      if (!metadata || typeof metadata !== 'object') return metadata;

      const SENSITIVE_KEYS = [
        'password',
        'token',
        'secret',
        'key',
        'auth',
        'cookie',
      ];

      if (Array.isArray(metadata)) {
        return metadata.map(sanitizeMetadata);
      }

      const sanitized = { ...metadata };
      for (const [key, value] of Object.entries(sanitized)) {
        if (SENSITIVE_KEYS.some((sk) => key.toLowerCase().includes(sk))) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          sanitized[key] = sanitizeMetadata(value);
        }
      }
      return sanitized;
    };

    const data = events.map((evt) => ({
      ...evt,
      createdAt: evt.created_at,
      metadata: sanitizeMetadata(evt.metadata),
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
