/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue, Processor, Process } from '@nestjs/bull';
import type { Queue, Job } from 'bull';
import { MonitoringService } from '../../monitoring/services/monitoring.service';

@Processor('livestream-monitor-jobs')
@Injectable()
export class LiveStreamMonitorProcessor implements OnModuleInit {
  private readonly logger = new Logger(LiveStreamMonitorProcessor.name);

  constructor(
    @InjectQueue('livestream-monitor-jobs')
    private readonly queue: Queue,
    private readonly monitoringService: MonitoringService,
  ) {}

  async onModuleInit() {
    // Repeatable job running every 30 seconds
    const activeJobs = await this.queue.getRepeatableJobs();
    const hasJob = activeJobs.some((job) => job.key.includes('30s-monitor'));
    if (!hasJob) {
      await this.queue.add(
        '30s-monitor',
        {},
        {
          repeat: { every: 30000 }, // 30,000 milliseconds = 30 seconds
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
      this.logger.log(
        'Live streams active monitoring background job registered.',
      );
    }
  }

  @Process('30s-monitor')
  async handleMonitor(job: Job) {
    this.logger.log(
      `Executing live streams health monitor check job ${job.id}...`,
    );
    try {
      await this.monitoringService.monitorActiveStreams();
    } catch (err: any) {
      this.logger.error(
        `Live streams health monitor check failed: ${err.message}`,
        err.stack,
      );
    }
  }
}
