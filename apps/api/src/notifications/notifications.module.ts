import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './services/notifications.service';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsRepository } from './repositories/notifications.repository';
import { NotificationGateway } from './websocket/notification.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    NotificationGateway,
  ],
  exports: [
    NotificationsService,
    NotificationsRepository,
    NotificationGateway,
    TypeOrmModule,
  ],
})
export class NotificationsModule {}
