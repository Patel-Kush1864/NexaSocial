/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue, Processor, Process } from '@nestjs/bull';
import type { Queue, Job } from 'bull';
import { SystemHealthService } from '../services/system-health.service';

@Processor('health-monitor-jobs')
@Injectable()
export class HealthMonitorProcessor implements OnModuleInit {
  private readonly logger = new Logger(HealthMonitorProcessor.name);

  constructor(
    @InjectQueue('health-monitor-jobs')
    private readonly queue: Queue,
    private readonly systemHealthService: SystemHealthService,
  ) {}

  async onModuleInit() {
    // Add repeatable job to run every minute
    const activeJobs = await this.queue.getRepeatableJobs();
    const hasJob = activeJobs.some((job) =>
      job.key.includes('health-monitor-check'),
    );
    if (!hasJob) {
      await this.queue.add(
        'health-monitor-check',
        {},
        {
          repeat: { cron: '* * * * *' }, // Every minute
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
      this.logger.log('Health monitor background job scheduled.');
    }
  }

  @Process('health-monitor-check')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handleHealthMonitorCheck(job: Job) {
    try {
      await this.systemHealthService.runAllChecks();
    } catch (err: any) {
      this.logger.error(
        `Background health monitor job failed: ${err.message}`,
        err.stack,
      );
    }
  }
}
