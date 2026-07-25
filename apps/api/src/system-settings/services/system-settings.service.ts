import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SystemSetting } from '../entities/system-setting.entity';
import { FeatureFlag } from '../entities/feature-flag.entity';

@Injectable()
export class SystemSettingsService {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly settingsRepository: Repository<SystemSetting>,
    @InjectRepository(FeatureFlag)
    private readonly flagsRepository: Repository<FeatureFlag>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getAllSettings(): Promise<Record<string, string>> {
    const settings = await this.settingsRepository.find();
    const result: Record<string, string> = {
      site_name: 'NexaSocial',
      support_email: 'support@nexasocial.com',
      default_language: 'en',
      maintenance_mode: 'false',
      default_subscription: 'Free',
    };
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }

  async getSetting(key: string, defaultValue = ''): Promise<string> {
    const s = await this.settingsRepository.findOne({ where: { key } });
    return s ? s.value : defaultValue;
  }

  async updateSetting(
    key: string,
    value: string,
    description?: string,
  ): Promise<SystemSetting> {
    let setting = await this.settingsRepository.findOne({ where: { key } });
    if (!setting) {
      setting = this.settingsRepository.create({ key, value, description });
    } else {
      setting.value = value;
      if (description) setting.description = description;
    }
    const saved = await this.settingsRepository.save(setting);
    this.eventEmitter.emit('system.setting.updated', { key, value });
    return saved;
  }

  async isMaintenanceMode(): Promise<boolean> {
    const val = await this.getSetting('maintenance_mode', 'false');
    return val === 'true';
  }

  async setMaintenanceMode(enabled: boolean): Promise<boolean> {
    await this.updateSetting(
      'maintenance_mode',
      enabled ? 'true' : 'false',
      'Global maintenance mode flag',
    );
    this.eventEmitter.emit('system.maintenance', { enabled });
    return enabled;
  }

  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    const defaults = [
      {
        name: 'AI_CAPTIONS',
        isEnabled: true,
        description: 'Enable AI social caption generation',
      },
      {
        name: 'LIVE_STREAMING',
        isEnabled: true,
        description: 'Enable multi-platform RTMP live streaming',
      },
      {
        name: 'TIKTOK_SUPPORT',
        isEnabled: true,
        description: 'Enable TikTok account integration',
      },
      {
        name: 'BETA_DASHBOARD',
        isEnabled: true,
        description: 'Enable redesigned enterprise dashboard',
      },
    ];

    const existing = await this.flagsRepository.find();
    const existingMap = new Map(existing.map((f) => [f.name, f]));

    for (const d of defaults) {
      if (!existingMap.has(d.name)) {
        const created = this.flagsRepository.create(d);
        await this.flagsRepository.save(created);
        existingMap.set(d.name, created);
      }
    }

    return Array.from(existingMap.values());
  }

  async toggleFeatureFlag(
    name: string,
    isEnabled: boolean,
  ): Promise<FeatureFlag> {
    let flag = await this.flagsRepository.findOne({ where: { name } });
    if (!flag) {
      flag = this.flagsRepository.create({ name, isEnabled });
    } else {
      flag.isEnabled = isEnabled;
    }

    const saved = await this.flagsRepository.save(flag);
    this.eventEmitter.emit('feature.flag.updated', { name, isEnabled });
    return saved;
  }
}
