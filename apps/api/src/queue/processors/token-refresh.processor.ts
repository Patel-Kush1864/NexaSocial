/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue, Processor, Process } from '@nestjs/bull';
import type { Queue, Job } from 'bull';
import { SocialService } from '../../social/services/social.service';

@Processor('token-refresh-jobs')
@Injectable()
export class TokenRefreshProcessor implements OnModuleInit {
  private readonly logger = new Logger(TokenRefreshProcessor.name);

  constructor(
    @InjectQueue('token-refresh-jobs')
    private readonly queue: Queue,
    private readonly socialService: SocialService,
  ) {}

  async onModuleInit() {
    // Add repeatable job to run every hour
    const activeJobs = await this.queue.getRepeatableJobs();
    const hasJob = activeJobs.some((job) => job.key.includes('hourly-refresh'));
    if (!hasJob) {
      await this.queue.add(
        'hourly-refresh',
        {},
        {
          repeat: { cron: '0 * * * *' }, // Every hour
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
      this.logger.log('Hourly OAuth token refresh background job scheduled.');
    }
  }

  @Process('hourly-refresh')
  async handleTokenRefresh(job: Job) {
    this.logger.log(`Executing background token refresh job ${job.id}...`);
    try {
      await this.socialService.refreshExpiredTokens();
      this.logger.log('Background token refresh job finished successfully.');
    } catch (err: any) {
      this.logger.error(
        `Background token refresh job failed: ${err.message}`,
        err.stack,
      );
    }
  }
}
