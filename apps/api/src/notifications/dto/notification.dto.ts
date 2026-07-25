import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsObject,
} from 'class-validator';
import {
  NotificationType,
  NotificationPriority,
} from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  @IsOptional()
  workspaceId?: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class QueryNotificationsDto {
  @IsUUID()
  @IsOptional()
  workspaceId?: string;

  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @IsOptional()
  limit?: number;

  @IsOptional()
  offset?: number;
}
