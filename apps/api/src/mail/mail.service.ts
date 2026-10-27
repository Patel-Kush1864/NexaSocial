/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { EmailLog, EmailStatus } from './entities/email-log.entity';
import { UserEmailPreference } from './entities/user-email-preference.entity';
import { EmailTemplateBuilder } from './templates/email-template.builder';
import {
  EmailLogQueryDto,
  UpdateEmailPreferencesDto,
} from './dto/email-query.dto';

export interface SendMailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  eventType?: string;
  userId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
  category?: 'ESSENTIAL' | 'STREAMING' | 'SOCIAL' | 'WORKSPACE' | 'MARKETING';
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  sendPasswordResetEmail: any;
  sendPasswordChangedEmail: any;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    @InjectRepository(EmailLog)
    private readonly emailLogRepo: Repository<EmailLog>,
    @InjectRepository(UserEmailPreference)
    private readonly prefRepo: Repository<UserEmailPreference>,
    @Optional()
    @InjectQueue('email-jobs')
    private readonly emailQueue?: Queue,
  ) { }

  /**
   * Verify SMTP connection status
   */
  async verifyConnection(): Promise<{
    isConnected: boolean;
    host: string;
    port: number;
    user: string;
    error?: string;
  }> {
    const host =
      this.configService.get<string>('mail.host') ||
      process.env.MAIL_HOST ||
      'smtp.gmail.com';
    const port = Number(
      this.configService.get<number>('mail.port') ||
      process.env.MAIL_PORT ||
      587,
    );
    const user =
      this.configService.get<string>('mail.user') ||
      process.env.MAIL_USER ||
      'unknown';
    const password =
      this.configService.get<string>('mail.password') ||
      process.env.MAIL_PASSWORD;

    if (!user || user === 'unknown' || !password) {
      this.logger.warn(
        'Email SMTP credentials not fully configured. Please set MAIL_HOST, MAIL_PORT, MAIL_USER, and MAIL_PASSWORD in your .env configuration for live email delivery.',
      );
      return {
        isConnected: false,
        host,
        port,
        user: user === 'unknown' ? 'Not configured' : this.maskEmail(user),
        error:
          'SMTP credentials missing. Please set MAIL_USER and MAIL_PASSWORD in .env',
      };
    }

    try {
      // Check nodemailer transporter verification if available
      const transporter = (this.mailerService as any)?.transporter;
      if (transporter && typeof transporter.verify === 'function') {
        await transporter.verify();
        return { isConnected: true, host, port, user: this.maskEmail(user) };
      }

      // Standalone verify fallback
      const nodemailer = require('nodemailer');
      const testTransport = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      });
      await testTransport.verify();
      return { isConnected: true, host, port, user: this.maskEmail(user) };
    } catch (err: any) {
      this.logger.error(`SMTP Verification failed: ${err.message}`);
      return {
        isConnected: false,
        host,
        port,
        user: this.maskEmail(user),
        error: err.message,
      };
    }
  }

  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email || '';
    const [name, domain] = email.split('@');
    if (name.length <= 2) return `***@${domain}`;
    return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
  }

  /**
   * Send Email with idempotency, preference filtering, retries, and delivery logging.
   */
  async sendMail(
    options: SendMailOptions,
  ): Promise<{ status: EmailStatus; logId?: string }> {
    const {
      to,
      subject,
      html,
      text,
      eventType = 'general',
      userId,
      idempotencyKey,
      metadata,
      category = 'ESSENTIAL',
    } = options;

    // 1. Idempotency Check
    if (idempotencyKey) {
      const existing = await this.emailLogRepo.findOne({
        where: { idempotencyKey },
      });
      if (existing) {
        if (existing.status === EmailStatus.SENT) {
          this.logger.log(
            `Duplicate email prevented by idempotency key: "${idempotencyKey}" for ${to}`,
          );
          return { status: EmailStatus.SKIPPED, logId: existing.id };
        }
      }
    }

    // 2. User Notification Preference Check (Non-essential only)
    if (userId && category !== 'ESSENTIAL') {
      const isAllowed = await this.checkUserCategoryPermission(
        userId,
        category,
      );
      if (!isAllowed) {
        this.logger.log(
          `Email skipped due to user notification preferences: Category ${category} disabled for user ${userId}`,
        );
        const log = this.emailLogRepo.create({
          recipient: to,
          userId,
          eventType,
          subject,
          status: EmailStatus.SKIPPED,
          idempotencyKey,
          metadata: {
            ...metadata,
            reason: 'UNSUBSCRIBED_PREFERENCE',
            category,
          },
        });
        await this.emailLogRepo.save(log);
        return { status: EmailStatus.SKIPPED, logId: log.id };
      }
    }

    // 3. Create or reuse Email Log in PENDING state
    let log: EmailLog;
    if (idempotencyKey) {
      const existing = await this.emailLogRepo.findOne({
        where: { idempotencyKey },
      });
      if (existing) {
        log = existing;
      } else {
        log = this.emailLogRepo.create({
          recipient: to,
          userId,
          eventType,
          subject,
          status: EmailStatus.PENDING,
          idempotencyKey,
          metadata,
        });
        await this.emailLogRepo.save(log);
      }
    } else {
      log = this.emailLogRepo.create({
        recipient: to,
        userId,
        eventType,
        subject,
        status: EmailStatus.PENDING,
        metadata,
      });
      await this.emailLogRepo.save(log);
    }

    // 4. Dispatch Email (Queue if available, or direct non-blocking async)
    if (this.emailQueue) {
      try {
        await this.emailQueue.add(
          'send-email',
          {
            logId: log.id,
            to,
            subject,
            html,
            text,
          },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 3000 },
            removeOnComplete: true,
            removeOnFail: false,
          },
        );
        return { status: EmailStatus.PENDING, logId: log.id };
      } catch (queueErr: any) {
        this.logger.warn(
          `Queueing to BullMQ failed (${queueErr.message}). Falling back to direct async delivery.`,
        );
      }
    }

    // Non-blocking async execution
    setImmediate(async () => {
      await this.executeDirectSend(log.id, to, subject, html, text);
    });

    return { status: EmailStatus.PENDING, logId: log.id };
  }

  /**
   * Internal sender with exponential retry mechanism
   */
  async executeDirectSend(
    logId: string,
    to: string,
    subject: string,
    html?: string,
    text?: string,
  ): Promise<boolean> {
    const maxAttempts = 3;
    let attempt = 0;
    let lastError: any = null;

    while (attempt < maxAttempts) {
      attempt++;
      try {
        this.logger.log(
          `[Attempt ${attempt}/${maxAttempts}] Sending email to ${to}: "${subject}"`,
        );
        await this.mailerService.sendMail({
          to,
          subject,
          html,
          text: text || html?.replace(/<[^>]+>/g, ' '),
        });

        // Mark as SENT
        await this.emailLogRepo.update(logId, {
          status: EmailStatus.SENT,
          sentAt: new Date(),
          retryCount: attempt - 1,
          errorMessage: undefined,
        });

        this.logger.log(
          `Email successfully delivered to ${to} (Log ID: ${logId})`,
        );
        return true;
      } catch (err: any) {
        lastError = err;
        this.logger.warn(
          `SMTP attempt ${attempt} failed for ${to}: ${err.message}`,
        );
        if (attempt < maxAttempts) {
          await new Promise((res) => setTimeout(res, attempt * 1500));
        }
      }
    }

    // Final failure recorded
    const sanitizedError = (lastError?.message || 'SMTP delivery failed').slice(
      0,
      500,
    );
    await this.emailLogRepo.update(logId, {
      status: EmailStatus.FAILED,
      retryCount: maxAttempts,
      errorMessage: sanitizedError,
    });
    this.logger.error(
      `Final email delivery failure for ${to}: ${sanitizedError}`,
    );
    return false;
  }

  // ──────────────────────────────────────────
  // USER PREFERENCES HELPER
  // ──────────────────────────────────────────

  private async checkUserCategoryPermission(
    userId: string,
    category: 'STREAMING' | 'SOCIAL' | 'WORKSPACE' | 'MARKETING',
  ): Promise<boolean> {
    try {
      let pref = await this.prefRepo.findOne({ where: { userId } });
      if (!pref) {
        pref = this.prefRepo.create({
          userId,
          streamingEmails: true,
          socialEmails: true,
          workspaceEmails: true,
          marketingEmails: false,
        });
        await this.prefRepo.save(pref);
      }

      if (category === 'STREAMING') return pref.streamingEmails;
      if (category === 'SOCIAL') return pref.socialEmails;
      if (category === 'WORKSPACE') return pref.workspaceEmails;
      if (category === 'MARKETING') return pref.marketingEmails;
      return true;
    } catch {
      return true; // Fallback to allowed on DB read issue
    }
  }

  async getPreferences(userId: string): Promise<UserEmailPreference> {
    let pref = await this.prefRepo.findOne({ where: { userId } });
    if (!pref) {
      pref = this.prefRepo.create({
        userId,
        streamingEmails: true,
        socialEmails: true,
        workspaceEmails: true,
        marketingEmails: false,
      });
      await this.prefRepo.save(pref);
    }
    return pref;
  }

  async updatePreferences(
    userId: string,
    dto: UpdateEmailPreferencesDto,
  ): Promise<UserEmailPreference> {
    const pref = await this.getPreferences(userId);
    if (dto.streamingEmails !== undefined)
      pref.streamingEmails = dto.streamingEmails;
    if (dto.socialEmails !== undefined) pref.socialEmails = dto.socialEmails;
    if (dto.workspaceEmails !== undefined)
      pref.workspaceEmails = dto.workspaceEmails;
    if (dto.marketingEmails !== undefined)
      pref.marketingEmails = dto.marketingEmails;
    return this.prefRepo.save(pref);
  }

  // ──────────────────────────────────────────
  // CONVENIENCE EVENT METHODS
  // ──────────────────────────────────────────

  async sendWelcomeEmail(user: { id: string; name: string; email: string }) {
    const template = EmailTemplateBuilder.welcomeUser({
      name: user.name,
      email: user.email,
    });
    return this.sendMail({
      to: user.email,
      userId: user.id,
      eventType: 'user.registered',
      subject: template.subject,
      html: template.html,
      text: template.text,
      idempotencyKey: `welcome_${user.id}`,
      category: 'ESSENTIAL',
    });
  }

  async sendEmailVerification(user: {
    id: string;
    name: string;
    email: string;
    token: string;
  }) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = `${frontendUrl}/verify-email?token=${user.token}`;
    const template = EmailTemplateBuilder.verifyEmail({
      name: user.name,
      email: user.email,
      verificationLink: link,
    });
    return this.sendMail({
      to: user.email,
      userId: user.id,
      eventType: 'user.email_verification_requested',
      subject: template.subject,
      html: template.html,
      text: template.text,
      idempotencyKey: `verify_${user.id}_${user.token.slice(0, 10)}`,
      category: 'ESSENTIAL',
    });
  }

  async sendPasswordReset(user: {
    id: string;
    name: string;
    email: string;
    token: string;
  }) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = `${frontendUrl}/reset-password?token=${user.token}`;
    const template = EmailTemplateBuilder.passwordReset({
      name: user.name,
      email: user.email,
      resetLink: link,
    });
    return this.sendMail({
      to: user.email,
      userId: user.id,
      eventType: 'user.password_reset_requested',
      subject: template.subject,
      html: template.html,
      text: template.text,
      idempotencyKey: `pwd_reset_${user.id}_${user.token.slice(0, 10)}`,
      category: 'ESSENTIAL',
    });
  }

  async sendPasswordChangedNotification(user: {
    id: string;
    name: string;
    email: string;
    ipAddress?: string;
  }) {
    const template = EmailTemplateBuilder.passwordChanged({
      name: user.name,
      email: user.email,
      ipAddress: user.ipAddress,
    });
    return this.sendMail({
      to: user.email,
      userId: user.id,
      eventType: 'user.password_changed',
      subject: template.subject,
      html: template.html,
      text: template.text,
      category: 'ESSENTIAL',
    });
  }

  async sendSubscriptionActivated(params: {
    userId: string;
    name: string;
    email: string;
    planName: string;
    price: number;
    currency?: string;
    endDate?: Date | string | null;
    billingCycle?: string;
    subscriptionId: string;
  }) {
    const template = EmailTemplateBuilder.subscriptionActivated({
      name: params.name,
      email: params.email,
      planName: params.planName,
      price: params.price,
      currency: params.currency,
      endDate: params.endDate,
      billingCycle: params.billingCycle,
    });
    return this.sendMail({
      to: params.email,
      userId: params.userId,
      eventType: 'subscription.activated',
      subject: template.subject,
      html: template.html,
      text: template.text,
      idempotencyKey: `sub_activated_${params.subscriptionId}`,
      metadata: { planName: params.planName, price: params.price },
      category: 'ESSENTIAL',
    });
  }

  async sendSubscriptionExpiringSoon(params: {
    userId: string;
    name: string;
    email: string;
    planName: string;
    daysLeft: number;
    expiryDate: Date | string;
    subscriptionId: string;
  }) {
    const template = EmailTemplateBuilder.subscriptionExpiringSoon({
      name: params.name,
      email: params.email,
      planName: params.planName,
      daysLeft: params.daysLeft,
      expiryDate: params.expiryDate,
    });
    return this.sendMail({
      to: params.email,
      userId: params.userId,
      eventType: 'subscription.expiring',
      subject: template.subject,
      html: template.html,
      text: template.text,
      idempotencyKey: `sub_expiring_${params.subscriptionId}_${params.daysLeft}d`,
      category: 'ESSENTIAL',
    });
  }

  async sendSubscriptionExpired(params: {
    userId: string;
    name: string;
    email: string;
    planName: string;
    subscriptionId: string;
  }) {
    const template = EmailTemplateBuilder.subscriptionExpired({
      name: params.name,
      email: params.email,
      planName: params.planName,
    });
    return this.sendMail({
      to: params.email,
      userId: params.userId,
      eventType: 'subscription.expired',
      subject: template.subject,
      html: template.html,
      text: template.text,
      idempotencyKey: `sub_expired_${params.subscriptionId}`,
      category: 'ESSENTIAL',
    });
  }

  async sendSubscriptionCancelled(params: {
    userId: string;
    name: string;
    email: string;
    planName: string;
    effectiveDate?: Date | string | null;
    subscriptionId: string;
  }) {
    const template = EmailTemplateBuilder.subscriptionCancelled({
      name: params.name,
      email: params.email,
      planName: params.planName,
      effectiveDate: params.effectiveDate,
    });
    return this.sendMail({
      to: params.email,
      userId: params.userId,
      eventType: 'subscription.cancelled',
      subject: template.subject,
      html: template.html,
      text: template.text,
      idempotencyKey: `sub_cancelled_${params.subscriptionId}`,
      category: 'ESSENTIAL',
    });
  }

  async sendPaymentSuccessReceipt(params: {
    userId: string;
    name: string;
    email: string;
    amount: number;
    currency?: string;
    paymentId: string;
    orderId?: string;
    planName: string;
    date?: Date | string;
  }) {
    const template = EmailTemplateBuilder.paymentSuccessReceipt({
      name: params.name,
      email: params.email,
      amount: params.amount,
      currency: params.currency,
      paymentId: params.paymentId,
      orderId: params.orderId,
      planName: params.planName,
      date: params.date,
    });
    return this.sendMail({
      to: params.email,
      userId: params.userId,
      eventType: 'payment.succeeded',
      subject: template.subject,
      html: template.html,
      text: template.text,
      idempotencyKey: `payment_receipt_${params.paymentId}`,
      metadata: { amount: params.amount, paymentId: params.paymentId },
      category: 'ESSENTIAL',
    });
  }

  async sendPaymentFailed(params: {
    userId: string;
    name: string;
    email: string;
    amount: number;
    currency?: string;
    planName: string;
    reason?: string;
    paymentId?: string;
  }) {
    const template = EmailTemplateBuilder.paymentFailed({
      name: params.name,
      email: params.email,
      amount: params.amount,
      currency: params.currency,
      planName: params.planName,
      reason: params.reason,
    });
    return this.sendMail({
      to: params.email,
      userId: params.userId,
      eventType: 'payment.failed',
      subject: template.subject,
      html: template.html,
      text: template.text,
      idempotencyKey: params.paymentId
        ? `payment_failed_${params.paymentId}`
        : undefined,
      category: 'ESSENTIAL',
    });
  }

  async sendStreamScheduled(params: {
    userId: string;
    name: string;
    email: string;
    title: string;
    scheduledAt: Date | string;
    platforms?: string[];
    streamId: string;
  }) {
    const template = EmailTemplateBuilder.streamScheduled({
      name: params.name,
      email: params.email,
      title: params.title,
      scheduledAt: params.scheduledAt,
      platforms: params.platforms,
      streamId: params.streamId,
    });
    return this.sendMail({
      to: params.email,
      userId: params.userId,
      eventType: 'livestream.scheduled',
      subject: template.subject,
      html: template.html,
      text: template.text,
      idempotencyKey: `stream_scheduled_${params.streamId}`,
      category: 'STREAMING',
    });
  }

  async sendStreamStarted(params: {
    userId: string;
    name: string;
    email: string;
    title: string;
    platformName?: string;
    platformsCount?: number;
    streamId: string;
  }) {
    const template = EmailTemplateBuilder.streamStarted({
      name: params.name,
      email: params.email,
      title: params.title,
      platformName: params.platformName,
      platformsCount: params.platformsCount,
      streamId: params.streamId,
    });
    return this.sendMail({
      to: params.email,
      userId: params.userId,
      eventType: 'livestream.started',
      subject: template.subject,
      html: template.html,
      text: template.text,
      idempotencyKey: `stream_started_${params.streamId}`,
      category: 'STREAMING',
    });
  }

  async sendStreamFailed(params: {
    userId: string;
    name: string;
    email: string;
    title: string;
    reason?: string;
    platformName?: string;
    streamId: string;
  }) {
    const template = EmailTemplateBuilder.streamFailed({
      name: params.name,
      email: params.email,
      title: params.title,
      reason: params.reason,
      platformName: params.platformName,
    });
    return this.sendMail({
      to: params.email,
      userId: params.userId,
      eventType: 'livestream.failed',
      subject: template.subject,
      html: template.html,
      text: template.text,
      idempotencyKey: `stream_failed_${params.streamId}_${Date.now()}`,
      category: 'STREAMING',
    });
  }

  async sendSocialConnected(params: {
    userId: string;
    name: string;
    email: string;
    platform: string;
    accountName: string;
    workspaceName?: string;
  }) {
    const template = EmailTemplateBuilder.socialAccountConnected({
      name: params.name,
      email: params.email,
      platform: params.platform,
      accountName: params.accountName,
      workspaceName: params.workspaceName,
    });
    return this.sendMail({
      to: params.email,
      userId: params.userId,
      eventType: 'social_account.connected',
      subject: template.subject,
      html: template.html,
      text: template.text,
      category: 'SOCIAL',
    });
  }

  async sendSocialReauthRequired(params: {
    userId: string;
    name: string;
    email: string;
    platform: string;
    accountName: string;
  }) {
    const template = EmailTemplateBuilder.socialAccountReauthRequired({
      name: params.name,
      email: params.email,
      platform: params.platform,
      accountName: params.accountName,
    });
    return this.sendMail({
      to: params.email,
      userId: params.userId,
      eventType: 'social_account.reauthorization_required',
      subject: template.subject,
      html: template.html,
      text: template.text,
      category: 'SOCIAL',
    });
  }

  async sendWorkspaceInvitation(params: {
    email: string;
    inviterName?: string;
    workspaceName: string;
    role: string;
    token: string;
    invitationId: string;
  }) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const acceptUrl = `${frontendUrl}/invitations/accept?token=${params.token}`;
    const template = EmailTemplateBuilder.workspaceInvitation({
      email: params.email,
      inviterName: params.inviterName,
      workspaceName: params.workspaceName,
      role: params.role,
      acceptUrl,
    });
    return this.sendMail({
      to: params.email,
      eventType: 'workspace.invitation_created',
      subject: template.subject,
      html: template.html,
      text: template.text,
      idempotencyKey: `invite_${params.invitationId}`,
      category: 'WORKSPACE',
    });
  }

  async sendSubscriptionRenewed(params: {
    userId: string;
    name: string;
    email: string;
    planName: string;
    price: number;
    currency?: string;
    newEndDate: Date | string;
    billingCycle?: string;
    subscriptionId: string;
  }) {
    const template = EmailTemplateBuilder.subscriptionRenewed({
      name: params.name,
      email: params.email,
      planName: params.planName,
      price: params.price,
      currency: params.currency,
      newEndDate: params.newEndDate,
      billingCycle: params.billingCycle,
    });
    return this.sendMail({
      to: params.email,
      userId: params.userId,
      eventType: 'subscription.renewed',
      subject: template.subject,
      html: template.html,
      text: template.text,
      idempotencyKey: `sub_renewed_${params.subscriptionId}_${new Date(params.newEndDate).getTime()}`,
      metadata: { planName: params.planName, price: params.price },
      category: 'ESSENTIAL',
    });
  }

  async sendSubscriptionPlanChanged(params: {
    userId: string;
    name: string;
    email: string;
    fromPlan: string;
    toPlan: string;
    changeType: 'upgrade' | 'downgrade';
    price: number;
    currency?: string;
    endDate?: Date | string | null;
    subscriptionId: string;
  }) {
    const template = EmailTemplateBuilder.subscriptionPlanChanged({
      name: params.name,
      email: params.email,
      fromPlan: params.fromPlan,
      toPlan: params.toPlan,
      changeType: params.changeType,
      price: params.price,
      currency: params.currency,
      endDate: params.endDate,
    });
    return this.sendMail({
      to: params.email,
      userId: params.userId,
      eventType:
        params.changeType === 'upgrade'
          ? 'subscription.upgraded'
          : 'subscription.downgraded',
      subject: template.subject,
      html: template.html,
      text: template.text,
      idempotencyKey: `sub_plan_changed_${params.subscriptionId}_${params.toPlan}`,
      metadata: {
        fromPlan: params.fromPlan,
        toPlan: params.toPlan,
        changeType: params.changeType,
      },
      category: 'ESSENTIAL',
    });
  }

  async sendPaymentRefunded(params: {
    userId: string;
    name: string;
    email: string;
    amount: number;
    currency?: string;
    paymentId: string;
    reason?: string;
  }) {
    const template = EmailTemplateBuilder.paymentRefunded({
      name: params.name,
      email: params.email,
      amount: params.amount,
      currency: params.currency,
      paymentId: params.paymentId,
      reason: params.reason,
    });
    return this.sendMail({
      to: params.email,
      userId: params.userId,
      eventType: 'payment.refunded',
      subject: template.subject,
      html: template.html,
      text: template.text,
      idempotencyKey: `payment_refund_${params.paymentId}`,
      metadata: { amount: params.amount, paymentId: params.paymentId },
      category: 'ESSENTIAL',
    });
  }

  async sendStreamEnded(params: {
    userId: string;
    name: string;
    email: string;
    title: string;
    endedAt: Date | string;
    streamId: string;
  }) {
    const template = EmailTemplateBuilder.streamEnded({
      name: params.name,
      email: params.email,
      title: params.title,
      endedAt: params.endedAt,
      streamId: params.streamId,
    });
    return this.sendMail({
      to: params.email,
      userId: params.userId,
      eventType: 'livestream.ended',
      subject: template.subject,
      html: template.html,
      text: template.text,
      idempotencyKey: `stream_ended_${params.streamId}`,
      category: 'STREAMING',
    });
  }

  async sendStreamReminder(params: {
    userId: string;
    name: string;
    email: string;
    title: string;
    scheduledAt: Date | string;
    platforms?: string[];
    streamId: string;
  }) {
    const template = EmailTemplateBuilder.streamReminder({
      name: params.name,
      email: params.email,
      title: params.title,
      scheduledAt: params.scheduledAt,
      platforms: params.platforms,
      streamId: params.streamId,
    });
    return this.sendMail({
      to: params.email,
      userId: params.userId,
      eventType: 'livestream.reminder',
      subject: template.subject,
      html: template.html,
      text: template.text,
      idempotencyKey: `stream_reminder_${params.streamId}_${new Date(params.scheduledAt).getTime()}`,
      category: 'STREAMING',
    });
  }

  async sendEmailChanged(params: {
    userId: string;
    name: string;
    oldEmail: string;
    newEmail: string;
  }) {
    const template = EmailTemplateBuilder.emailChanged({
      name: params.name,
      oldEmail: params.oldEmail,
      newEmail: params.newEmail,
    });
    // Send to both old email and new email for security
    await this.sendMail({
      to: params.oldEmail,
      userId: params.userId,
      eventType: 'user.email_changed',
      subject: template.subject,
      html: template.html,
      text: template.text,
      category: 'ESSENTIAL',
    });
    return this.sendMail({
      to: params.newEmail,
      userId: params.userId,
      eventType: 'user.email_changed',
      subject: template.subject,
      html: template.html,
      text: template.text,
      category: 'ESSENTIAL',
    });
  }

  async sendWorkspaceInvitationAccepted(params: {
    inviterUserId: string;
    inviterName: string;
    inviterEmail: string;
    acceptedUserName: string;
    acceptedUserEmail: string;
    workspaceName: string;
    role: string;
  }) {
    const template = EmailTemplateBuilder.workspaceInvitationAccepted(params);
    return this.sendMail({
      to: params.inviterEmail,
      userId: params.inviterUserId,
      eventType: 'workspace.invitation_accepted',
      subject: template.subject,
      html: template.html,
      text: template.text,
      category: 'WORKSPACE',
    });
  }

  async sendWorkspaceMemberRoleChanged(params: {
    userId: string;
    name: string;
    email: string;
    workspaceName: string;
    oldRole: string;
    newRole: string;
  }) {
    const template = EmailTemplateBuilder.workspaceMemberRoleChanged(params);
    return this.sendMail({
      to: params.email,
      userId: params.userId,
      eventType: 'workspace.member_role_changed',
      subject: template.subject,
      html: template.html,
      text: template.text,
      category: 'WORKSPACE',
    });
  }

  async sendWorkspaceMemberRemoved(params: {
    userId: string;
    name: string;
    email: string;
    workspaceName: string;
  }) {
    const template = EmailTemplateBuilder.workspaceMemberRemoved(params);
    return this.sendMail({
      to: params.email,
      userId: params.userId,
      eventType: 'workspace.member_removed',
      subject: template.subject,
      html: template.html,
      text: template.text,
      category: 'WORKSPACE',
    });
  }

  async sendWorkspaceOwnershipTransferred(params: {
    userId: string;
    name: string;
    email: string;
    workspaceName: string;
    isNewOwner: boolean;
    otherPartyName: string;
  }) {
    const template = EmailTemplateBuilder.workspaceOwnershipTransferred(params);
    return this.sendMail({
      to: params.email,
      userId: params.userId,
      eventType: 'workspace.ownership_transferred',
      subject: template.subject,
      html: template.html,
      text: template.text,
      category: 'WORKSPACE',
    });
  }

  async sendSocialDisconnected(params: {
    userId: string;
    name: string;
    email: string;
    platform: string;
    accountName: string;
    workspaceName?: string;
  }) {
    const template = EmailTemplateBuilder.socialAccountDisconnected(params);
    return this.sendMail({
      to: params.email,
      userId: params.userId,
      eventType: 'social_account.disconnected',
      subject: template.subject,
      html: template.html,
      text: template.text,
      category: 'SOCIAL',
    });
  }

  async sendAdminNewUserRegistered(params: {
    adminEmail: string;
    userId: string;
    userName: string;
    userEmail: string;
    registeredAt: Date | string;
  }) {
    const template = EmailTemplateBuilder.adminNewUserRegistered(params);
    return this.sendMail({
      to: params.adminEmail,
      eventType: 'admin.new_user_registered',
      subject: template.subject,
      html: template.html,
      text: template.text,
      category: 'ESSENTIAL',
    });
  }

  async sendAdminPlatformAlert(params: {
    adminEmail: string;
    subject: string;
    alertTitle: string;
    message: string;
    details?: Record<string, any>;
  }) {
    const template = EmailTemplateBuilder.adminPlatformAlert(params);
    return this.sendMail({
      to: params.adminEmail,
      eventType: 'admin.platform_alert',
      subject: template.subject,
      html: template.html,
      text: template.text,
      category: 'ESSENTIAL',
    });
  }

  async sendAdminTestEmail(adminEmail: string) {
    const host =
      this.configService.get<string>('mail.host') ||
      process.env.MAIL_HOST ||
      'smtp.gmail.com';
    const port = Number(
      this.configService.get<number>('mail.port') ||
      process.env.MAIL_PORT ||
      587,
    );
    const template = EmailTemplateBuilder.adminTestEmail({
      adminEmail,
      smtpHost: host,
      smtpPort: port,
      timestamp: new Date(),
    });

    return this.sendMail({
      to: adminEmail,
      eventType: 'admin.test_email',
      subject: template.subject,
      html: template.html,
      text: template.text,
      category: 'ESSENTIAL',
    });
  }

  // ──────────────────────────────────────────
  // ADMIN EMAIL LOGS & STATS
  // ──────────────────────────────────────────

  async getLogs(query: EmailLogQueryDto) {
    const {
      page = 1,
      limit = 20,
      status,
      eventType,
      search,
      dateFrom,
      dateTo,
    } = query;
    const qb = this.emailLogRepo.createQueryBuilder('log');

    if (status) {
      qb.andWhere('log.status = :status', { status });
    }
    if (eventType) {
      qb.andWhere('log.eventType = :eventType', { eventType });
    }
    const searchTerm = search || query.recipient;
    if (searchTerm) {
      qb.andWhere('(log.recipient LIKE :searchTerm OR log.subject LIKE :searchTerm)', {
        searchTerm: `%${searchTerm}%`,
      });
    }
    if (dateFrom) {
      qb.andWhere('log.createdAt >= :dateFrom', {
        dateFrom: new Date(dateFrom),
      });
    }
    if (dateTo) {
      qb.andWhere('log.createdAt <= :dateTo', { dateTo: new Date(dateTo) });
    }

    qb.orderBy('log.createdAt', 'DESC');
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      logs: data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats() {
    const [total, sent, failed, skipped, pending] = await Promise.all([
      this.emailLogRepo.count(),
      this.emailLogRepo.count({ where: { status: EmailStatus.SENT } }),
      this.emailLogRepo.count({ where: { status: EmailStatus.FAILED } }),
      this.emailLogRepo.count({ where: { status: EmailStatus.SKIPPED } }),
      this.emailLogRepo.count({ where: { status: EmailStatus.PENDING } }),
    ]);

    return {
      total,
      sent,
      failed,
      skipped,
      pending,
    };
  }

  async retryFailedEmail(id: string): Promise<boolean> {
    const log = await this.emailLogRepo.findOne({ where: { id } });
    if (!log) {
      throw new Error('Email log not found');
    }

    this.logger.log(`Admin retrying email ID ${id} to ${log.recipient}`);
    log.status = EmailStatus.PENDING;
    await this.emailLogRepo.save(log);

    return this.executeDirectSend(
      log.id,
      log.recipient,
      log.subject,
      undefined,
      undefined,
    );
  }
}
