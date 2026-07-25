/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue, Processor, Process } from '@nestjs/bull';
import type { Queue, Job } from 'bull';
import { LiveStreamsService } from '../../livestreams/services/livestreams.service';

@Processor('livestream-scheduler-jobs')
@Injectable()
export class LiveStreamSchedulerProcessor implements OnModuleInit {
  private readonly logger = new Logger(LiveStreamSchedulerProcessor.name);

  constructor(
    @InjectQueue('livestream-scheduler-jobs')
    private readonly queue: Queue,
    private readonly streamsService: LiveStreamsService,
  ) {}

  async onModuleInit() {
    // Repeatable job running every minute
    const activeJobs = await this.queue.getRepeatableJobs();
    const hasJob = activeJobs.some((job) => job.key.includes('minute-check'));
    if (!hasJob) {
      await this.queue.add(
        'minute-check',
        {},
        {
          repeat: { cron: '* * * * *' }, // Every minute
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
      this.logger.log(
        'Live streams scheduled checker background job registered.',
      );
    }
  }

  @Process('minute-check')
  async handleMinuteCheck(job: Job) {
    this.logger.log(
      `Executing live streams scheduler checker job ${job.id}...`,
    );
    try {
      await this.streamsService.startScheduledStreamsBackground();
      this.logger.log('Live streams scheduler checker finished.');
    } catch (err: any) {
      this.logger.error(
        `Live streams scheduler checker failed: ${err.message}`,
        err.stack,
      );
    }
  }
}
