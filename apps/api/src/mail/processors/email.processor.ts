/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { MailService } from '../mail.service';

@Processor('email-jobs')
@Injectable()
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailService: MailService) {}

  @Process('send-email')
  async handleSendEmail(
    job: Job<{
      logId: string;
      to: string;
      subject: string;
      html?: string;
      text?: string;
    }>,
  ) {
    this.logger.log(
      `[BullMQ] Processing queued email job ${job.id} for ${job.data.to}: "${job.data.subject}"`,
    );

    const success = await this.mailService.executeDirectSend(
      job.data.logId,
      job.data.to,
      job.data.subject,
      job.data.html,
      job.data.text,
    );

    if (!success) {
      throw new Error(`Failed to deliver queued email job ${job.id}`);
    }
  }
}
