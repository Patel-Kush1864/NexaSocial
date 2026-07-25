/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue, Processor, Process } from '@nestjs/bull';
import type { Queue, Job } from 'bull';
import { SocialService } from '../../social/services/social.service';

@Processor('profile-sync-jobs')
@Injectable()
export class ProfileSyncProcessor implements OnModuleInit {
  private readonly logger = new Logger(ProfileSyncProcessor.name);

  constructor(
    @InjectQueue('profile-sync-jobs')
    private readonly queue: Queue,
    private readonly socialService: SocialService,
  ) {}

  async onModuleInit() {
    // Add repeatable job to run daily at 1 AM
    const activeJobs = await this.queue.getRepeatableJobs();
    const hasJob = activeJobs.some((job) => job.key.includes('daily-sync'));
    if (!hasJob) {
      await this.queue.add(
        'daily-sync',
        {},
        {
          repeat: { cron: '0 1 * * *' }, // Daily at 1:00 AM
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
      this.logger.log(
        'Daily social accounts profile sync background job scheduled.',
      );
    }
  }

  @Process('daily-sync')
  async handleProfileSync(job: Job) {
    this.logger.log(`Executing daily profiles sync job ${job.id}...`);
    try {
      await this.socialService.syncAllProfilesBackground();
      this.logger.log('Daily profiles sync job finished successfully.');
    } catch (err: any) {
      this.logger.error(
        `Daily profiles sync job failed: ${err.message}`,
        err.stack,
      );
    }
  }
}
