import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AdminLiveStreamsService } from '../services/admin-live-streams.service';
import { AdminGetLiveStreamsDto } from '../dto/live-streams.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/decorators/permissions.decorator';

@Controller('admin/live-streams')
@UseGuards(JwtAuthGuard, AdminGuard, PermissionsGuard)
export class AdminLiveStreamsController {
  constructor(private readonly liveStreamsService: AdminLiveStreamsService) {}

  @Get()
  @RequirePermission('platform.livestreams.view')
  async getLiveStreams(@Query() query: AdminGetLiveStreamsDto) {
    return this.liveStreamsService.getLiveStreams(query);
  }

  @Get('statistics')
  @RequirePermission('platform.livestreams.view')
  async getStatistics() {
    return this.liveStreamsService.getStatistics();
  }

  @Get(':id/errors')
  @RequirePermission('platform.livestreams.view')
  async getStreamErrors(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.liveStreamsService.getStreamErrors(id, page, limit);
  }
}
