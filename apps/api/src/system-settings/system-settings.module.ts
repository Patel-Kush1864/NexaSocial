import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemSetting } from './entities/system-setting.entity';
import { FeatureFlag } from './entities/feature-flag.entity';
import { SystemSettingsService } from './services/system-settings.service';
import { SystemSettingsController } from './controllers/system-settings.controller';
import { MaintenanceGuard } from './guards/maintenance.guard';

@Module({
  imports: [TypeOrmModule.forFeature([SystemSetting, FeatureFlag])],
  controllers: [SystemSettingsController],
  providers: [SystemSettingsService, MaintenanceGuard],
  exports: [SystemSettingsService, MaintenanceGuard, TypeOrmModule],
})
export class SystemSettingsModule {}
