import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringService } from './services/monitoring.service';
import { MonitoringController } from './controllers/monitoring.controller';
import { LiveStream } from '../livestreams/entities/livestream.entity';
import { StreamPlatform } from '../stream-platforms/entities/stream-platform.entity';
import { OAuthToken } from '../social/entities/oauth-token.entity';
import { LiveStreamsModule } from '../livestreams/livestreams.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LiveStream, StreamPlatform, OAuthToken]),
    LiveStreamsModule,
  ],
  controllers: [MonitoringController],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
