/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue, Processor, Process } from '@nestjs/bull';
import type { Queue, Job } from 'bull';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';

@Processor('subscription-jobs')
@Injectable()
export class SubscriptionExpiryProcessor implements OnModuleInit {
  private readonly logger = new Logger(SubscriptionExpiryProcessor.name);

  constructor(
    @InjectQueue('subscription-jobs')
    private readonly queue: Queue,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async onModuleInit() {
    try {
      // Clean up previous repeatable configurations to avoid duplicates
      const repeatableJobs = await this.queue.getRepeatableJobs();
      for (const job of repeatableJobs) {
        await this.queue.removeRepeatableByKey(job.key);
      }

      // Register daily cron check for plan expirations (runs every day at midnight)
      await this.queue.add(
        'check-expiry',
        {},
        {
          repeat: { cron: '0 0 * * *' },
          jobId: 'daily-subscription-expiry-check',
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
      this.logger.log(
        'Successfully scheduled daily subscription expiry repeatable job.',
      );
    } catch (error: any) {
      this.logger.warn(
        `Redis queue scheduling warning (is Redis running?): ${error.message}`,
      );
    }
  }

  @Process('check-expiry')
  async handleExpiryCheck(job: Job) {
    this.logger.log(`Executing subscription expiry background job: ${job.id}`);
    try {
      await this.subscriptionsService.processExpirationJob();
      this.logger.log('Subscription expiry check completed successfully.');
    } catch (error: any) {
      this.logger.error(
        `Error executing subscription expiry check: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
