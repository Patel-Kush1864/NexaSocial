import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { AuditMeta } from '../../audit/decorators/audit-meta.decorator';
import { FeatureFlag } from '../../system-settings/entities/feature-flag.entity';
import { AuditService } from '../../audit/services/audit.service';
import { User } from '../../users/entities/user.entity';
import { SystemSettingsService } from '../../system-settings/services/system-settings.service';

@Injectable()
export class AdminFeatureFlagsService {
  constructor(
    @InjectRepository(FeatureFlag)
    private readonly flagsRepository: Repository<FeatureFlag>,
    private readonly auditService: AuditService,
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly systemSettingsService: SystemSettingsService,
  ) {}

  async getFeatureFlags(): Promise<FeatureFlag[]> {
    // Rely on system settings service to ensure defaults are populated
    await this.systemSettingsService.getAllFeatureFlags();

    return this.flagsRepository.find({
      order: {
        updated_at: 'DESC',
      },
    });
  }

  async getStatistics() {
    const flags = await this.getFeatureFlags();
    const enabled = flags.filter((f) => f.isEnabled).length;
    const disabled = flags.length - enabled;

    return {
      total: flags.length,
      enabled,
      disabled,
    };
  }

  async toggleFeatureFlag(
    key: string,
    isEnabled: boolean,
    adminUser: User,
    auditMeta?: AuditMeta,
  ): Promise<FeatureFlag> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('READ COMMITTED');

    try {
      // Find the flag
      const flag = await queryRunner.manager.findOne(FeatureFlag, {
        where: { name: key },
        lock: { mode: 'pessimistic_write' },
      });

      if (!flag) {
        throw new NotFoundException(`Feature flag with key ${key} not found.`);
      }

      // Check if it's a no-op
      if (flag.isEnabled === isEnabled) {
        await queryRunner.rollbackTransaction();
        return flag; // no-op, just return current state
      }

      const previousState = flag.isEnabled;
      flag.isEnabled = isEnabled;

      const updatedFlag = await queryRunner.manager.save(FeatureFlag, flag);

      // Audit log
      const auditLog = this.auditService['repository'].create({
        adminUserId: adminUser.id,
        action: 'FEATURE_FLAG_CHANGED',
        module: 'FEATURE_FLAG',
        targetType: 'FEATURE_FLAG',
        targetId: updatedFlag.name,
        targetName: updatedFlag.name,
        ipAddress: auditMeta?.ipAddress,
        userAgent: auditMeta?.userAgent,
        requestId: auditMeta?.requestId,
        metadata: {
          flagKey: updatedFlag.name,
          previousEnabled: previousState,
          newEnabled: isEnabled,
        },
      });
      await queryRunner.manager.save(auditLog);

      await queryRunner.commitTransaction();

      // Update cache
      await this.cacheManager.set(
        `feature_flag:${updatedFlag.name}`,
        isEnabled,
      );

      return updatedFlag;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
