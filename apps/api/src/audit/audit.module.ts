import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuditLog } from './entities/admin-audit-log.entity';
import { AuditService } from './services/audit.service';
import { AuditController } from './controllers/audit.controller';
import { AuditRepository } from './repositories/audit.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AdminAuditLog])],
  controllers: [AuditController],
  providers: [AuditService, AuditRepository],
  exports: [AuditService, AuditRepository, TypeOrmModule],
})
export class AuditModule {}
