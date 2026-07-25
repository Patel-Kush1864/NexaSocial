/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  template?: string;
  context?: Record<string, any>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendMail(options: SendMailOptions): Promise<void> {
    try {
      this.logger.log(
        `Attempting to send email to ${options.to}: "${options.subject}"`,
      );
      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        text: options.text,
        template: options.template,
        context: options.context,
      });
      this.logger.log(`Email sent successfully to ${options.to}`);
    } catch (error: any) {
      // Graceful fallback for testing and development environments where SMTP might not be set up
      this.logger.warn(
        `SMTP email delivery failed: ${error.message}. Logging contents:`,
      );
      this.logger.warn(`--- EMAIL DRAFT ---`);
      this.logger.warn(`To: ${options.to}`);
      this.logger.warn(`Subject: ${options.subject}`);
      this.logger.warn(
        `Body: ${options.text || JSON.stringify(options.context)}`,
      );
      this.logger.warn(`-------------------`);
    }
  }
}
