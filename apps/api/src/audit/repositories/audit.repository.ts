import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AdminAuditLog } from '../entities/admin-audit-log.entity';

@Injectable()
export class AuditRepository extends Repository<AdminAuditLog> {
  constructor(private readonly dataSource: DataSource) {
    super(AdminAuditLog, dataSource.createEntityManager());
  }

  async findAuditLogs(
    adminUserId?: string,
    moduleName?: string,
    limit = 50,
    offset = 0,
  ): Promise<[AdminAuditLog[], number]> {
    const query = this.createQueryBuilder('log').leftJoinAndSelect(
      'log.adminUser',
      'adminUser',
    );

    if (adminUserId) {
      query.andWhere('log.adminUserId = :adminUserId', { adminUserId });
    }

    if (moduleName) {
      query.andWhere('log.module = :moduleName', { moduleName });
    }

    query.orderBy('log.created_at', 'DESC').take(limit).skip(offset);

    return query.getManyAndCount();
  }
}
