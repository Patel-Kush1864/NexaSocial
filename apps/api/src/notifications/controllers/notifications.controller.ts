import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../../auth/interfaces/current-user.interface';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  async getNotifications(
    @CurrentUser() user: CurrentUserType,
    @Query('workspaceId') workspaceId?: string,
    @Query('isRead') isReadStr?: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    const isRead = isReadStr !== undefined ? isReadStr === 'true' : undefined;
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    return this.service.getUserNotifications(
      user.id,
      workspaceId,
      isRead,
      limit,
      offset,
    );
  }

  @Get('unread-count')
  async getUnreadCount(
    @CurrentUser() user: CurrentUserType,
    @Query('workspaceId') workspaceId?: string,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    const count = await this.service.getUnreadCount(user.id, workspaceId);
    return { unreadCount: count };
  }

  @Patch('read-all')
  async markAllRead(
    @CurrentUser() user: CurrentUserType,
    @Query('workspaceId') workspaceId?: string,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    return this.service.markAllAsRead(user.id, workspaceId);
  }

  @Patch(':id/read')
  async markRead(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
  ) {
    if (!user) throw new BadRequestException('User context missing');
    return this.service.markAsRead(id, user.id);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    if (!user) throw new BadRequestException('User context missing');
    await this.service.delete(id, user.id);
    return { success: true };
  }
}
