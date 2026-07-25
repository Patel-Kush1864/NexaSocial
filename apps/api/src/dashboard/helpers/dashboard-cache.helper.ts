/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class DashboardCacheHelper {
  private readonly logger = new Logger(DashboardCacheHelper.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  getCacheKey(prefix: string, workspaceId: string): string {
    return `dashboard:${prefix}:${workspaceId}`;
  }

  async get<T>(prefix: string, workspaceId: string): Promise<T | null> {
    const key = this.getCacheKey(prefix, workspaceId);
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache hit for key ${key}`);
        return value;
      }
    } catch (err: any) {
      this.logger.warn(`Failed to read from cache key ${key}: ${err?.message}`);
    }
    return null;
  }

  async set<T>(
    prefix: string,
    workspaceId: string,
    value: T,
    ttlMs = 60000,
  ): Promise<void> {
    const key = this.getCacheKey(prefix, workspaceId);
    try {
      await this.cacheManager.set(key, value, ttlMs);
      this.logger.debug(`Cache stored for key ${key}`);
    } catch (err: any) {
      this.logger.warn(`Failed to write to cache key ${key}: ${err?.message}`);
    }
  }

  async invalidateWorkspaceCache(workspaceId: string): Promise<void> {
    const prefixes = ['summary', 'statistics', 'widgets'];
    for (const prefix of prefixes) {
      const key = this.getCacheKey(prefix, workspaceId);
      try {
        await this.cacheManager.del(key);
        this.logger.debug(`Invalidated cache key ${key}`);
      } catch (err: any) {
        this.logger.warn(
          `Failed to invalidate cache key ${key}: ${err?.message}`,
        );
      }
    }
  }
}
