import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from '../../notifications/entities/notification.entity';

export enum NotificationTargetType {
  ALL_USERS = 'ALL_USERS',
  ALL_WORKSPACES = 'ALL_WORKSPACES',
  SPECIFIC_USER = 'SPECIFIC_USER',
  SPECIFIC_WORKSPACE = 'SPECIFIC_WORKSPACE',
}

export class AdminNotificationDto {
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;

  @IsEnum(NotificationTargetType)
  @IsNotEmpty()
  targetType: NotificationTargetType;

  @IsString()
  @IsOptional()
  targetUserId?: string;

  @IsString()
  @IsOptional()
  targetWorkspaceId?: string;
}

export class AdminNotificationPreviewDto extends AdminNotificationDto {}
export class AdminNotificationSendDto extends AdminNotificationDto {}

export class AdminGetNotificationsDto {
  @IsOptional()
  page?: string;

  @IsOptional()
  @Type(() => Number)
  @IsIn([10, 20, 50, 100])
  limit?: number;

  @IsOptional()
  search?: string;

  @IsOptional()
  type?: NotificationType;

  @IsOptional()
  targetType?: NotificationTargetType;

  @IsOptional()
  sortBy?: string;

  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';
}
