import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from '../../../src/mail/mail.service';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  EmailLog,
  EmailStatus,
} from '../../../src/mail/entities/email-log.entity';
import { UserEmailPreference } from '../../../src/mail/entities/user-email-preference.entity';
import { EmailTemplateBuilder } from '../../../src/mail/templates/email-template.builder';

const flushAsync = () => new Promise((resolve) => setTimeout(resolve, 50));

describe('MailService & Email System (Comprehensive Unit)', () => {
  let mailService: MailService;
  let mockMailerService: { sendMail: jest.Mock };
  let mockConfigService: { get: jest.Mock };
  let mockEmailLogRepo: any;
  let mockPrefRepo: any;

  const mockLogs: EmailLog[] = [];
  const mockPrefs: Map<string, UserEmailPreference> = new Map();

  beforeEach(async () => {
    mockLogs.length = 0;
    mockPrefs.clear();

    mockMailerService = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-msg-12345' }),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'mail.host') return 'smtp.gmail.com';
        if (key === 'mail.port') return 587;
        if (key === 'mail.user') return 'nexasocial101@gmail.com';
        if (key === 'mail.from') return 'nexasocial101@gmail.com';
        return null;
      }),
    };

    mockEmailLogRepo = {
      create: jest.fn().mockImplementation((dto) => ({
        id: 'mock-log-uuid-' + Math.random().toString(36).substring(7),
        status: EmailStatus.PENDING,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...dto,
      })),
      save: jest.fn().mockImplementation(async (log: EmailLog) => {
        const existingIdx = mockLogs.findIndex((l) => l.id === log.id);
        if (existingIdx >= 0) {
          Object.assign(mockLogs[existingIdx], log);
          return mockLogs[existingIdx];
        }
        mockLogs.push(log);
        return log;
      }),
      update: jest.fn().mockImplementation(async (id: string, partial: any) => {
        const existingIdx = mockLogs.findIndex((l) => l.id === id);
        if (existingIdx >= 0) {
          Object.assign(mockLogs[existingIdx], partial);
        }
        return { affected: existingIdx >= 0 ? 1 : 0 };
      }),
      findOne: jest.fn().mockImplementation(async (query: any) => {
        if (query.where?.idempotencyKey) {
          return mockLogs.find(
            (l) => l.idempotencyKey === query.where.idempotencyKey,
          );
        }
        if (query.where?.id) {
          return mockLogs.find((l) => l.id === query.where.id);
        }
        return null;
      }),
      findAndCount: jest
        .fn()
        .mockImplementation(async () => [mockLogs, mockLogs.length]),
      count: jest.fn().mockImplementation(async (query?: any) => {
        if (query?.where?.status) {
          return mockLogs.filter((l) => l.status === query.where.status).length;
        }
        return mockLogs.length;
      }),
    };

    mockPrefRepo = {
      findOne: jest.fn().mockImplementation(async (query: any) => {
        const userId = query.where?.userId;
        return mockPrefs.get(userId) || null;
      }),
      create: jest.fn().mockImplementation((dto) => ({
        id: 'pref-uuid',
        ...dto,
      })),
      save: jest.fn().mockImplementation(async (pref: UserEmailPreference) => {
        mockPrefs.set(pref.userId, pref);
        return pref;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: MailerService, useValue: mockMailerService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getRepositoryToken(EmailLog), useValue: mockEmailLogRepo },
        {
          provide: getRepositoryToken(UserEmailPreference),
          useValue: mockPrefRepo,
        },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Registration & Welcome Emails', () => {
    it('should dispatch welcome email after user registration', async () => {
      const response = await mailService.sendWelcomeEmail({
        id: 'user-101',
        name: 'Alex Mercer',
        email: 'newuser@nexasocial.com',
      });

      expect(response.status).toBe(EmailStatus.PENDING);
      await flushAsync();

      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockMailerService.sendMail.mock.calls[0][0];
      expect(callArgs.to).toBe('newuser@nexasocial.com');
      expect(callArgs.subject).toContain('Welcome to NexaSocial');
      expect(callArgs.html).toContain('Alex Mercer');
      expect(callArgs.html).toContain('AI-Powered Social & Live Streaming');

      // Verify email_logs persistence
      expect(
        mockLogs.some(
          (l) =>
            l.eventType === 'user.registered' && l.status === EmailStatus.SENT,
        ),
      ).toBe(true);
    });

    it('should escape HTML in user inputs to prevent XSS injection', () => {
      const maliciousName = '<script>alert("hacked")</script>';
      const template = EmailTemplateBuilder.welcomeUser({
        name: maliciousName,
        email: 'attacker@evil.com',
      });

      expect(template.html).not.toContain('<script>');
      expect(template.html).toContain(
        '&lt;script&gt;alert(&quot;hacked&quot;)&lt;/script&gt;',
      );
    });
  });

  describe('2. Email Verification & Security Alerts', () => {
    it('should send verification email with token link and not leak token to logs', async () => {
      const verifyToken = 'secure-single-use-token-xyz789';
      const response = await mailService.sendEmailVerification({
        id: 'user-102',
        name: 'Jordan Lee',
        email: 'verify@nexasocial.com',
        token: verifyToken,
      });

      expect(response.status).toBe(EmailStatus.PENDING);
      await flushAsync();

      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);
      const mailCall = mockMailerService.sendMail.mock.calls[0][0];
      expect(mailCall.html).toContain(verifyToken);
      expect(mailCall.subject).toContain(
        'Verify your NexaSocial email address',
      );

      // Check log metadata does not contain raw token
      const log = mockLogs.find(
        (l) => l.eventType === 'user.email_verification_requested',
      );
      expect(log).toBeDefined();
      expect(JSON.stringify(log?.metadata || {})).not.toContain(verifyToken);
    });

    it('should send password reset notification email', async () => {
      const resetToken = 'reset-token-abc12345';
      const response = await mailService.sendPasswordReset({
        id: 'user-103',
        name: 'Taylor Smith',
        email: 'reset@nexasocial.com',
        token: resetToken,
      });

      expect(response.status).toBe(EmailStatus.PENDING);
      await flushAsync();

      const mailCall = mockMailerService.sendMail.mock.calls[0][0];
      expect(mailCall.subject).toContain('Reset your NexaSocial password');
      expect(mailCall.html).toContain('1 hour');
    });

    it('should notify user when password is changed', async () => {
      const response = await mailService.sendPasswordChangedNotification({
        id: 'user-104',
        name: 'Sam Vance',
        email: 'security@nexasocial.com',
        ipAddress: '192.168.1.50',
      });

      expect(response.status).toBe(EmailStatus.PENDING);
      await flushAsync();

      const mailCall = mockMailerService.sendMail.mock.calls[0][0];
      expect(mailCall.subject).toContain('Security Alert');
      expect(mailCall.html).toContain('192.168.1.50');
    });
  });

  describe('3. Duplicate Prevention & Webhook Idempotency', () => {
    it('should skip duplicate payment receipt when both client verification and webhook fire', async () => {
      const paymentDetails = {
        userId: 'user-105',
        name: 'Customer One',
        email: 'billing@nexasocial.com',
        paymentId: 'pay_ABC123456789',
        orderId: 'order_DEF987654321',
        amount: 2999,
        currency: 'INR',
        planName: 'Creator Pro',
        date: new Date().toISOString(),
      };

      // 1st Call: Client verification succeeds
      const firstResult =
        await mailService.sendPaymentSuccessReceipt(paymentDetails);
      expect(firstResult.status).toBe(EmailStatus.PENDING);
      await flushAsync();

      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);

      // Verify log has idempotencyKey and marked as SENT
      const initialLog = mockLogs.find(
        (l) => l.idempotencyKey === 'payment_receipt_pay_ABC123456789',
      );
      expect(initialLog).toBeDefined();
      expect(initialLog?.status).toBe(EmailStatus.SENT);

      // 2nd Call: Webhook arrives with the same paymentId
      const secondResult =
        await mailService.sendPaymentSuccessReceipt(paymentDetails);

      // Must detect existing SENT email and skip
      expect(secondResult.status).toBe(EmailStatus.SKIPPED);
      await flushAsync();

      // STILL only 1 SMTP delivery made, duplicate was prevented!
      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);
    });
  });

  describe('4. Subscription Reminders & Expiry', () => {
    it('should send subscription activation with plan details', async () => {
      const response = await mailService.sendSubscriptionActivated({
        userId: 'user-106',
        name: 'Elena Rostova',
        email: 'sub@nexasocial.com',
        planName: 'Enterprise Growth',
        price: 9999,
        currency: 'INR',
        subscriptionId: 'sub-uuid-106',
      });

      expect(response.status).toBe(EmailStatus.PENDING);
      await flushAsync();

      const mailCall = mockMailerService.sendMail.mock.calls[0][0];
      expect(mailCall.subject).toContain('Welcome to Enterprise Growth!');
      expect(mailCall.html).toContain('₹9,999');
    });

    it('should send subscription expiring reminder for 7, 3, and 1 days intervals', async () => {
      for (const days of [7, 3, 1]) {
        const response = await mailService.sendSubscriptionExpiringSoon({
          userId: 'user-106',
          name: 'Elena Rostova',
          email: 'renew@nexasocial.com',
          planName: 'Enterprise Growth',
          expiryDate: '2026-10-20',
          daysLeft: days,
          subscriptionId: 'sub-uuid-106',
        });

        expect(response.status).toBe(EmailStatus.PENDING);
      }
      await flushAsync();

      // Check all 3 distinct interval reminders were processed
      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(3);
      expect(
        mockLogs.some(
          (l) => l.idempotencyKey === 'sub_expiring_sub-uuid-106_7d',
        ),
      ).toBe(true);
      expect(
        mockLogs.some(
          (l) => l.idempotencyKey === 'sub_expiring_sub-uuid-106_3d',
        ),
      ).toBe(true);
      expect(
        mockLogs.some(
          (l) => l.idempotencyKey === 'sub_expiring_sub-uuid-106_1d',
        ),
      ).toBe(true);
    });
  });

  describe('5. User Preferences & Unsubscribe Suppression', () => {
    it('should skip streaming emails when user disabled streaming preference', async () => {
      // User disabled streaming emails
      mockPrefs.set('user-unsub-stream', {
        id: 'pref-1',
        userId: 'user-unsub-stream',
        streamingEmails: false,
        socialEmails: true,
        workspaceEmails: true,
        marketingEmails: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await mailService.sendStreamStarted({
        userId: 'user-unsub-stream',
        name: 'Streamer',
        email: 'streamer@nexasocial.com',
        title: 'Live Product Launch',
        platformName: 'YouTube',
        streamId: 'stream-101',
      });

      expect(response.status).toBe(EmailStatus.SKIPPED);
      await flushAsync();

      // SMTP transport NOT called because preference is disabled
      expect(mockMailerService.sendMail).not.toHaveBeenCalled();

      // Log must be recorded as SKIPPED
      const log = mockLogs.find((l) => l.eventType === 'livestream.started');
      expect(log?.status).toBe(EmailStatus.SKIPPED);
    });

    it('should NEVER suppress essential security or billing emails even if user opted out', async () => {
      // User disabled all optional categories
      mockPrefs.set('user-essential-only', {
        id: 'pref-2',
        userId: 'user-essential-only',
        streamingEmails: false,
        socialEmails: false,
        workspaceEmails: false,
        marketingEmails: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Send password reset (ESSENTIAL)
      const response = await mailService.sendPasswordReset({
        id: 'user-essential-only',
        name: 'User',
        email: 'essential@nexasocial.com',
        token: 'token-123',
      });

      expect(response.status).toBe(EmailStatus.PENDING);
      await flushAsync();

      // Essential emails MUST still be dispatched!
      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);
    });
  });

  describe('6. Error Handling & Retry Redelivery', () => {
    it('should allow retrying a failed email through retryFailedEmail', async () => {
      const failedLog: EmailLog = {
        id: 'log-retry-1',
        recipient: 'retry@nexasocial.com',
        subject: 'Retry Subject',
        eventType: 'test.retry',
        status: EmailStatus.FAILED,
        retryCount: 1,
        errorMessage: 'Temporary network failure',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockLogs.push(failedLog);

      // Make mailer succeed on retry
      mockMailerService.sendMail.mockResolvedValueOnce({
        messageId: 'success-retry-msg',
      });

      const success = await mailService.retryFailedEmail('log-retry-1');
      expect(success).toBe(true);
      expect(failedLog.status).toBe(EmailStatus.SENT);
      expect(failedLog.retryCount).toBe(0);
    });
  });

  describe('7. SMTP Connection Status Check', () => {
    it('should return masked credentials and connection status without exposing secrets', async () => {
      const status = await mailService.verifyConnection();

      expect(status.host).toBe('smtp.gmail.com');
      expect(status.port).toBe(587);
      expect(status.user).toMatch(/ne\*\*\*.*@gmail\.com/);
      // Secret password MUST NOT be exposed
      expect((status as any).password).toBeUndefined();
      expect((status as any).pass).toBeUndefined();
    });
  });

  describe('8. Subscription Renewal & Plan Changes', () => {
    it('should send subscription renewal confirmation', async () => {
      const response = await mailService.sendSubscriptionRenewed({
        userId: 'user-renew-1',
        name: 'Carlos Santana',
        email: 'carlos@example.com',
        planName: 'Creator Pro',
        price: 2999,
        currency: 'INR',
        newEndDate: '2026-11-20',
        billingCycle: 'Monthly',
        subscriptionId: 'sub-renew-1',
      });

      expect(response.status).toBe(EmailStatus.PENDING);
      await flushAsync();

      const mailCall = mockMailerService.sendMail.mock.calls[0][0];
      expect(mailCall.subject).toContain('Subscription Renewed: NexaSocial Creator Pro');
      expect(mailCall.html).toContain('₹2,999');
      expect(mailCall.html).toContain('Carlos Santana');
    });

    it('should send subscription upgrade notification', async () => {
      const response = await mailService.sendSubscriptionPlanChanged({
        userId: 'user-upgrade-1',
        name: 'Sarah Connor',
        email: 'sarah@example.com',
        fromPlan: 'Starter',
        toPlan: 'Agency Super',
        changeType: 'upgrade',
        price: 5999,
        currency: 'INR',
        subscriptionId: 'sub-plan-1',
      });

      expect(response.status).toBe(EmailStatus.PENDING);
      await flushAsync();

      const mailCall = mockMailerService.sendMail.mock.calls[0][0];
      expect(mailCall.subject).toContain('Subscription Upgraded to Agency Super');
      expect(mailCall.html).toContain('Starter');
      expect(mailCall.html).toContain('Agency Super');
    });

    it('should send subscription cancelled notice', async () => {
      const response = await mailService.sendSubscriptionCancelled({
        userId: 'user-cancel-1',
        name: 'Marcus Bell',
        email: 'marcus@example.com',
        planName: 'Creator Pro',
        subscriptionId: 'sub-cancel-1',
      });

      expect(response.status).toBe(EmailStatus.PENDING);
      await flushAsync();

      const mailCall = mockMailerService.sendMail.mock.calls[0][0];
      expect(mailCall.subject).toContain('Subscription Cancelled: Creator Pro');
      expect(mailCall.html).toContain('Creator Pro');
    });
  });

  describe('9. Payment Failures & Refunds', () => {
    it('should send payment failure email with reason', async () => {
      const response = await mailService.sendPaymentFailed({
        userId: 'user-fail-1',
        name: 'Devon Miles',
        email: 'devon@example.com',
        amount: 2999,
        currency: 'INR',
        planName: 'Creator Pro',
        reason: 'Card expired or insufficient funds',
        paymentId: 'pay_failed_123',
      });

      expect(response.status).toBe(EmailStatus.PENDING);
      await flushAsync();

      const mailCall = mockMailerService.sendMail.mock.calls[0][0];
      expect(mailCall.subject).toContain('Payment Failed');
      expect(mailCall.html).toContain('Card expired or insufficient funds');
    });

    it('should send refund completed email', async () => {
      const response = await mailService.sendPaymentRefunded({
        userId: 'user-refund-1',
        name: 'Devon Miles',
        email: 'devon@example.com',
        amount: 2999,
        currency: 'INR',
        paymentId: 'pay_refund_123',
        reason: 'Requested by customer',
      });

      expect(response.status).toBe(EmailStatus.PENDING);
      await flushAsync();

      const mailCall = mockMailerService.sendMail.mock.calls[0][0];
      expect(mailCall.subject).toContain('Refund Processed');
      expect(mailCall.html).toContain('pay_refund_123');
      expect(mailCall.html).toContain('₹2,999');
    });
  });

  describe('10. Live Streaming Notifications', () => {
    it('should send stream ended broadcast summary', async () => {
      const response = await mailService.sendStreamEnded({
        userId: 'streamer-1',
        name: 'Livestream Host',
        email: 'streamer@example.com',
        title: 'Q3 Product Keynote',
        endedAt: new Date().toISOString(),
        streamId: 'stream-end-123',
      });

      expect(response.status).toBe(EmailStatus.PENDING);
      await flushAsync();

      const mailCall = mockMailerService.sendMail.mock.calls[0][0];
      expect(mailCall.subject).toContain('Live Stream Ended: "Q3 Product Keynote"');
      expect(mailCall.html).toContain('Broadcast Summary');
    });

    it('should send upcoming stream reminder email', async () => {
      const response = await mailService.sendStreamReminder({
        userId: 'streamer-1',
        name: 'Livestream Host',
        email: 'streamer@example.com',
        title: 'Weekly Community AMA',
        scheduledAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        platforms: ['YOUTUBE', 'FACEBOOK'],
        streamId: 'stream-remind-123',
      });

      expect(response.status).toBe(EmailStatus.PENDING);
      await flushAsync();

      const mailCall = mockMailerService.sendMail.mock.calls[0][0];
      expect(mailCall.subject).toContain('Reminder: Stream "Weekly Community AMA" starts soon!');
      expect(mailCall.html).toContain('YOUTUBE, FACEBOOK');
    });

    it('should send stream failure recovery alert', async () => {
      const response = await mailService.sendStreamFailed({
        userId: 'streamer-1',
        name: 'Livestream Host',
        email: 'streamer@example.com',
        title: 'Live Tournament Broadcast',
        reason: 'RTMP handshake failed on remote CDN endpoint',
        platformName: 'YouTube',
        streamId: 'stream-fail-123',
      });

      expect(response.status).toBe(EmailStatus.PENDING);
      await flushAsync();

      const mailCall = mockMailerService.sendMail.mock.calls[0][0];
      expect(mailCall.subject).toContain('Broadcast failed');
      expect(mailCall.html).toContain('RTMP handshake failed');
    });
  });

  describe('11. Workspace Team Notifications', () => {
    it('should send invitation accepted notification to inviter', async () => {
      const response = await mailService.sendWorkspaceInvitationAccepted({
        inviterUserId: 'inviter-1',
        inviterName: 'Lead Designer',
        inviterEmail: 'lead@example.com',
        acceptedUserName: 'New Teammate',
        acceptedUserEmail: 'teammate@example.com',
        workspaceName: 'Acme Studio',
        role: 'EDITOR',
      });

      expect(response.status).toBe(EmailStatus.PENDING);
      await flushAsync();

      const mailCall = mockMailerService.sendMail.mock.calls[0][0];
      expect(mailCall.to).toBe('lead@example.com');
      expect(mailCall.subject).toContain('Invitation Accepted: New Teammate joined "Acme Studio"');
      expect(mailCall.html).toContain('EDITOR');
    });

    it('should send member role changed notification', async () => {
      const response = await mailService.sendWorkspaceMemberRoleChanged({
        userId: 'member-1',
        name: 'Alex Developer',
        email: 'alex@example.com',
        workspaceName: 'Acme Studio',
        oldRole: 'VIEWER',
        newRole: 'ADMIN',
      });

      expect(response.status).toBe(EmailStatus.PENDING);
      await flushAsync();

      const mailCall = mockMailerService.sendMail.mock.calls[0][0];
      expect(mailCall.subject).toContain('Role Updated in "Acme Studio": ADMIN');
      expect(mailCall.html).toContain('VIEWER');
      expect(mailCall.html).toContain('ADMIN');
    });

    it('should send member removed notification', async () => {
      const response = await mailService.sendWorkspaceMemberRemoved({
        userId: 'member-1',
        name: 'Alex Developer',
        email: 'alex@example.com',
        workspaceName: 'Acme Studio',
      });

      expect(response.status).toBe(EmailStatus.PENDING);
      await flushAsync();

      const mailCall = mockMailerService.sendMail.mock.calls[0][0];
      expect(mailCall.subject).toContain('Workspace Access Update: "Acme Studio"');
      expect(mailCall.html).toContain('removed from the workspace');
    });

    it('should send ownership transfer notices to new and old owners', async () => {
      const response = await mailService.sendWorkspaceOwnershipTransferred({
        userId: 'new-owner-1',
        name: 'New Boss',
        email: 'newboss@example.com',
        workspaceName: 'Acme Studio',
        isNewOwner: true,
        otherPartyName: 'Old Boss',
      });

      expect(response.status).toBe(EmailStatus.PENDING);
      await flushAsync();

      const mailCall = mockMailerService.sendMail.mock.calls[0][0];
      expect(mailCall.subject).toContain('Workspace Ownership Transferred: "Acme Studio"');
      expect(mailCall.html).toContain('Primary Owner');
    });
  });

  describe('12. Social Account Notifications', () => {
    it('should send social channel disconnected notification', async () => {
      const response = await mailService.sendSocialDisconnected({
        userId: 'user-social-1',
        name: 'Social Creator',
        email: 'creator@example.com',
        platform: 'YOUTUBE',
        accountName: 'Tech Reviews Channel',
        workspaceName: 'Main Studio',
      });

      expect(response.status).toBe(EmailStatus.PENDING);
      await flushAsync();

      const mailCall = mockMailerService.sendMail.mock.calls[0][0];
      expect(mailCall.subject).toContain('Channel Disconnected: YOUTUBE (Tech Reviews Channel)');
      expect(mailCall.html).toContain('Main Studio');
    });

    it('should send social reauthorization required notice', async () => {
      const response = await mailService.sendSocialReauthRequired({
        userId: 'user-social-1',
        name: 'Social Creator',
        email: 'creator@example.com',
        platform: 'FACEBOOK',
        accountName: 'Official Fan Page',
      });

      expect(response.status).toBe(EmailStatus.PENDING);
      await flushAsync();

      const mailCall = mockMailerService.sendMail.mock.calls[0][0];
      expect(mailCall.subject).toContain('Reconnect your FACEBOOK account');
      expect(mailCall.html).toContain('Official Fan Page');
    });
  });

  describe('13. Security: Email Address Change', () => {
    it('should dispatch security alert to both old and new email addresses', async () => {
      await mailService.sendEmailChanged({
        userId: 'user-sec-1',
        name: 'Security User',
        oldEmail: 'old@example.com',
        newEmail: 'new@example.com',
      });

      await flushAsync();

      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(2);
      const firstCall = mockMailerService.sendMail.mock.calls[0][0];
      const secondCall = mockMailerService.sendMail.mock.calls[1][0];

      expect(firstCall.to).toBe('old@example.com');
      expect(secondCall.to).toBe('new@example.com');
      expect(firstCall.subject).toContain('Security Alert: Account Email Address Changed');
      expect(secondCall.subject).toContain('Security Alert: Account Email Address Changed');
    });
  });
});
