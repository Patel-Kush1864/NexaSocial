import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { StreamPlatformsService } from '../services/stream-platforms.service';
import { StreamPlatform } from '../entities/stream-platform.entity';

@Controller('stream-platforms')
@UseGuards(JwtAuthGuard)
export class StreamPlatformsController {
  constructor(private readonly service: StreamPlatformsService) {}

  @Get('stream/:streamId')
  async getByStreamId(
    @Param('streamId') streamId: string,
  ): Promise<StreamPlatform[]> {
    return this.service.findByStreamId(streamId);
  }

  @Get(':id')
  async getOne(@Param('id') id: string): Promise<StreamPlatform> {
    return this.service.findOne(id);
  }
}
