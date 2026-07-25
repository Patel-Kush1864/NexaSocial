import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StreamPlatform } from './entities/stream-platform.entity';
import { StreamPlatformsService } from './services/stream-platforms.service';
import { StreamPlatformsController } from './controllers/stream-platforms.controller';
import { StreamPlatformsRepository } from './repositories/stream-platforms.repository';

@Module({
  imports: [TypeOrmModule.forFeature([StreamPlatform])],
  controllers: [StreamPlatformsController],
  providers: [StreamPlatformsService, StreamPlatformsRepository],
  exports: [StreamPlatformsService, StreamPlatformsRepository, TypeOrmModule],
})
export class StreamPlatformsModule {}
