import { Injectable, Logger } from '@nestjs/common';
import { LiveStreamsService } from '../services/livestreams.service';

@Injectable()
export class LiveStreamSchedulerService {
  private readonly logger = new Logger(LiveStreamSchedulerService.name);

  constructor(private readonly streamsService: LiveStreamsService) {}

  async triggerScheduledStreamsCheck(): Promise<void> {
    this.logger.log('Executing background check for due scheduled streams...');
    await this.streamsService.startScheduledStreamsBackground();
  }
}
