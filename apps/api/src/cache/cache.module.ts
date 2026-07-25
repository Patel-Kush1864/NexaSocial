import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    NestCacheModule.register({
      isGlobal: true,
      ttl: 60 * 1000, // 60 seconds default TTL
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
