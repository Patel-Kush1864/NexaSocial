import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminAuditLog } from '../entities/admin-audit-log.entity';
import { CreateAuditLogDto } from '../dto/audit.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AdminAuditLog)
    private readonly repository: Repository<AdminAuditLog>,
  ) {}

  async logAction(dto: CreateAuditLogDto): Promise<AdminAuditLog> {
    const log = this.repository.create({
      adminUserId: dto.adminUserId,
      action: dto.action,
      module: dto.module || 'SYSTEM',
      targetId: dto.targetId,
      metadata: dto.metadata,
      ipAddress: dto.ipAddress,
    });
    return this.repository.save(log);
  }

  async getLogs(
    adminUserId?: string,
    moduleName?: string,
    limit = 50,
    offset = 0,
  ): Promise<{ data: AdminAuditLog[]; total: number }> {
    const query = this.repository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.adminUser', 'adminUser');

    if (adminUserId) {
      query.andWhere('log.adminUserId = :adminUserId', { adminUserId });
    }

    if (moduleName) {
      query.andWhere('log.module = :moduleName', { moduleName });
    }

    query.orderBy('log.created_at', 'DESC').take(limit).skip(offset);

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }
}
