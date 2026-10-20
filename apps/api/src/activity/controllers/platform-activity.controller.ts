/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ActivityService } from '../services/activity.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../admin/guards/admin.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/decorators/permissions.decorator';
import { QueryActivityDto } from '../dto/activity.dto';

@Controller('platform/activity')
@UseGuards(JwtAuthGuard, AdminGuard, PermissionsGuard)
export class PlatformActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @RequirePermission('platform.activity.view')
  async getPlatformActivity(@Query() query: QueryActivityDto) {
    // Merge defaults
    const params: QueryActivityDto = {
      limit: 10,
      offset: 0,
      ...query,
    };

    if (query.page) {
      params.offset = (Number(query.page) - 1) * Number(params.limit || 10);
    }

    // Convert limit to number since query params are strings
    if (params.limit) {
      params.limit = Number(params.limit);
    }

    const { data, total } =
      await this.activityService.getPlatformActivity(params);

    const page = query.page ? Number(query.page) : 1;
    const limit = params.limit || 10;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get(':id')
  @RequirePermission('platform.activity.view')
  async getActivityDetails(@Param('id') id: string) {
    const activity = await this.activityService.getPlatformActivityById(id);
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }
    return { data: activity };
  }
}
