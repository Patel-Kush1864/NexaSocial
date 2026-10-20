import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityEvent } from './entities/security-event.entity';
import { SecurityService } from './services/security.service';
import { SecurityController } from './controllers/security.controller';
import { UserSession } from '../users/entities/user-session.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SecurityEvent, UserSession]),
    AuditModule,
  ],
  controllers: [SecurityController],
  providers: [SecurityService],
  exports: [SecurityService],
})
export class SecurityModule {}
