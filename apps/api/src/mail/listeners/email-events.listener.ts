/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, Optional } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MailService } from '../mail.service';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class EmailEventsListener {
  private readonly logger = new Logger(EmailEventsListener.name);

  constructor(
    private readonly mailService: MailService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @Optional()
    private readonly dataSource?: DataSource,
  ) { }

  private async resolveUser(
    userId: string,
  ): Promise<{ name: string; email: string } | null> {
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user || !user.email) return null;
      const name =
        `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
        user.email.split('@')[0];
      return { name, email: user.email };
    } catch {
      return null;
    }
  }

  private async resolveStreamMeta(
    streamId: string,
  ): Promise<{ title: string; userId: string } | null> {
    if (!this.dataSource) return null;
    try {
      const rows = await this.dataSource.query(
        'SELECT title, created_by FROM live_streams WHERE id = ? LIMIT 1',
        [streamId],
      );
      if (rows && rows[0]) {
        return {
          title: rows[0].title || 'Untitled Stream',
          userId: rows[0].created_by,
        };
      }
    } catch {
      // Fallback
    }
    return null;
  }

  // ──────────────────────────────────────────
  // 1. REGISTRATION & AUTHENTICATION
  // ──────────────────────────────────────────

  @OnEvent('user.registered')
  async handleUserRegistered(event: {
    userId?: string;
    email?: string;
    name?: string;
    firstName?: string;
  }) {
    this.logger.log(
      `Received [user.registered] event for ${event.email || event.userId}`,
    );
    let email = event.email;
    let name = event.name || event.firstName || 'there';

    if (event.userId && (!email || !name)) {
      const user = await this.resolveUser(event.userId);
      if (user) {
        email = user.email;
        name = user.name;
      }
    }

    if (email) {
      await this.mailService.sendWelcomeEmail({
        id: event.userId || 'new-user',
        name,
        email,
      });

      // Optionally notify platform administrators of new user registration
      const adminEmail = process.env.ADMIN_SEED_EMAIL;
      if (adminEmail && event.userId) {
        try {
          await this.mailService.sendAdminNewUserRegistered({
            adminEmail,
            userId: event.userId,
            userName: name,
            userEmail: email,
            registeredAt: new Date(),
          });
        } catch {
          // Admin alert is non-blocking
        }
      }
    }
  }

  @OnEvent('user.email_changed')
  async handleUserEmailChanged(event: {
    userId: string;
    name: string;
    oldEmail: string;
    newEmail: string;
  }) {
    this.logger.log(
      `Received [user.email_changed] for User ${event.userId}`,
    );
    await this.mailService.sendEmailChanged({
      userId: event.userId,
      name: event.name,
      oldEmail: event.oldEmail,
      newEmail: event.newEmail,
    });
  }

  // ──────────────────────────────────────────
  // 2. SUBSCRIPTIONS
  // ──────────────────────────────────────────

  @OnEvent('subscription.activated')
  async handleSubscriptionActivated(event: {
    userId: string;
    planName: string;
    price: number;
    currency?: string;
    endDate?: Date | string | null;
    billingCycle?: string;
    subscriptionId: string;
  }) {
    this.logger.log(
      `Received [subscription.activated] event for User ${event.userId}, Plan ${event.planName}`,
    );
    const user = await this.resolveUser(event.userId);
    if (!user) return;

    await this.mailService.sendSubscriptionActivated({
      userId: event.userId,
      name: user.name,
      email: user.email,
      planName: event.planName,
      price: event.price,
      currency: event.currency,
      endDate: event.endDate,
      billingCycle: event.billingCycle,
      subscriptionId: event.subscriptionId,
    });
  }

  @OnEvent('subscription.renewed')
  async handleSubscriptionRenewed(event: {
    userId: string;
    planName: string;
    price: number;
    currency?: string;
    newEndDate: Date | string;
    billingCycle?: string;
    subscriptionId: string;
  }) {
    this.logger.log(
      `Received [subscription.renewed] event for User ${event.userId}`,
    );
    const user = await this.resolveUser(event.userId);
    if (!user) return;

    await this.mailService.sendSubscriptionRenewed({
      userId: event.userId,
      name: user.name,
      email: user.email,
      planName: event.planName,
      price: event.price,
      currency: event.currency,
      newEndDate: event.newEndDate,
      billingCycle: event.billingCycle,
      subscriptionId: event.subscriptionId,
    });
  }

  @OnEvent('subscription.cancelled')
  async handleSubscriptionCancelled(event: {
    userId: string;
    planName: string;
    effectiveDate?: Date | string | null;
    subscriptionId: string;
  }) {
    this.logger.log(
      `Received [subscription.cancelled] event for User ${event.userId}`,
    );
    const user = await this.resolveUser(event.userId);
    if (!user) return;

    await this.mailService.sendSubscriptionCancelled({
      userId: event.userId,
      name: user.name,
      email: user.email,
      planName: event.planName,
      effectiveDate: event.effectiveDate,
      subscriptionId: event.subscriptionId,
    });
  }

  @OnEvent('subscription.upgraded')
  @OnEvent('subscription.downgraded')
  async handleSubscriptionTierChanged(event: {
    userId: string;
    fromPlan: string;
    toPlan: string;
    changeType: 'upgrade' | 'downgrade';
    price: number;
    currency?: string;
    endDate?: Date | string | null;
    subscriptionId: string;
  }) {
    this.logger.log(
      `Received [subscription.${event.changeType}d] event for User ${event.userId}`,
    );
    const user = await this.resolveUser(event.userId);
    if (!user) return;

    await this.mailService.sendSubscriptionPlanChanged({
      userId: event.userId,
      name: user.name,
      email: user.email,
      fromPlan: event.fromPlan,
      toPlan: event.toPlan,
      changeType: event.changeType,
      price: event.price,
      currency: event.currency,
      endDate: event.endDate,
      subscriptionId: event.subscriptionId,
    });
  }

  // ──────────────────────────────────────────
  // 3. PAYMENTS & REFUNDS
  // ──────────────────────────────────────────

  @OnEvent('payment.succeeded')
  async handlePaymentSucceeded(event: {
    userId: string;
    amount: number;
    currency?: string;
    paymentId: string;
    orderId?: string;
    planName: string;
    date?: Date | string;
  }) {
    this.logger.log(
      `Received [payment.succeeded] event for Payment ${event.paymentId}`,
    );
    const user = await this.resolveUser(event.userId);
    if (!user) return;

    await this.mailService.sendPaymentSuccessReceipt({
      userId: event.userId,
      name: user.name,
      email: user.email,
      amount: event.amount,
      currency: event.currency,
      paymentId: event.paymentId,
      orderId: event.orderId,
      planName: event.planName,
      date: event.date,
    });
  }

  @OnEvent('payment.failed')
  async handlePaymentFailed(event: {
    userId: string;
    amount: number;
    currency?: string;
    planName: string;
    reason?: string;
    paymentId?: string;
  }) {
    this.logger.log(`Received [payment.failed] event for User ${event.userId}`);
    const user = await this.resolveUser(event.userId);
    if (!user) return;

    await this.mailService.sendPaymentFailed({
      userId: event.userId,
      name: user.name,
      email: user.email,
      amount: event.amount,
      currency: event.currency,
      planName: event.planName,
      reason: event.reason,
      paymentId: event.paymentId,
    });
  }

  @OnEvent('payment.refunded')
  async handlePaymentRefunded(event: {
    userId: string;
    amount: number;
    currency?: string;
    paymentId: string;
    reason?: string;
  }) {
    this.logger.log(`Received [payment.refunded] event for Payment ${event.paymentId}`);
    const user = await this.resolveUser(event.userId);
    if (!user) return;

    await this.mailService.sendPaymentRefunded({
      userId: event.userId,
      name: user.name,
      email: user.email,
      amount: event.amount,
      currency: event.currency,
      paymentId: event.paymentId,
      reason: event.reason,
    });
  }

  // ──────────────────────────────────────────
  // 4. LIVE STREAMING
  // ──────────────────────────────────────────

  @OnEvent('stream.scheduled')
  async handleStreamScheduled(event: {
    streamId: string;
    workspaceId?: string;
    userId?: string;
    title?: string;
    scheduledAt: Date;
    platforms?: string[];
  }) {
    let userId = event.userId;
    let title = event.title;

    if (!userId || !title) {
      const meta = await this.resolveStreamMeta(event.streamId);
      if (meta) {
        userId = userId || meta.userId;
        title = title || meta.title;
      }
    }

    if (!userId) return;
    const user = await this.resolveUser(userId);
    if (!user) return;

    await this.mailService.sendStreamScheduled({
      userId,
      name: user.name,
      email: user.email,
      title: title || 'Live Stream',
      scheduledAt: event.scheduledAt,
      platforms: event.platforms,
      streamId: event.streamId,
    });
  }

  @OnEvent('stream.reminder')
  async handleStreamReminder(event: {
    streamId: string;
    workspaceId?: string;
    userId?: string;
    title?: string;
    scheduledAt: Date;
    platforms?: string[];
  }) {
    let userId = event.userId;
    let title = event.title;

    if (!userId || !title) {
      const meta = await this.resolveStreamMeta(event.streamId);
      if (meta) {
        userId = userId || meta.userId;
        title = title || meta.title;
      }
    }

    if (!userId) return;
    const user = await this.resolveUser(userId);
    if (!user) return;

    await this.mailService.sendStreamReminder({
      userId,
      name: user.name,
      email: user.email,
      title: title || 'Live Stream',
      scheduledAt: event.scheduledAt,
      platforms: event.platforms,
      streamId: event.streamId,
    });
  }

  @OnEvent('stream.started')
  async handleStreamStarted(event: {
    streamId: string;
    workspaceId?: string;
    userId?: string;
    title?: string;
    platformName?: string;
    platformsCount?: number;
  }) {
    let userId = event.userId;
    let title = event.title;

    if (!userId || !title) {
      const meta = await this.resolveStreamMeta(event.streamId);
      if (meta) {
        userId = userId || meta.userId;
        title = title || meta.title;
      }
    }

    if (!userId) return;
    const user = await this.resolveUser(userId);
    if (!user) return;

    await this.mailService.sendStreamStarted({
      userId,
      name: user.name,
      email: user.email,
      title: title || 'Live Stream',
      platformName: event.platformName,
      platformsCount: event.platformsCount,
      streamId: event.streamId,
    });
  }

  @OnEvent('stream.ended')
  async handleStreamEnded(event: {
    streamId: string;
    workspaceId?: string;
    userId?: string;
    title?: string;
    endedAt?: Date;
  }) {
    let userId = event.userId;
    let title = event.title;

    if (!userId || !title) {
      const meta = await this.resolveStreamMeta(event.streamId);
      if (meta) {
        userId = userId || meta.userId;
        title = title || meta.title;
      }
    }

    if (!userId) return;
    const user = await this.resolveUser(userId);
    if (!user) return;

    await this.mailService.sendStreamEnded({
      userId,
      name: user.name,
      email: user.email,
      title: title || 'Live Stream',
      endedAt: event.endedAt || new Date(),
      streamId: event.streamId,
    });
  }

  @OnEvent('stream.failed')
  async handleStreamFailed(event: {
    streamId: string;
    workspaceId?: string;
    userId?: string;
    title?: string;
    reason?: string;
    platformName?: string;
  }) {
    let userId = event.userId;
    let title = event.title;

    if (!userId || !title) {
      const meta = await this.resolveStreamMeta(event.streamId);
      if (meta) {
        userId = userId || meta.userId;
        title = title || meta.title;
      }
    }

    if (!userId) return;
    const user = await this.resolveUser(userId);
    if (!user) return;

    await this.mailService.sendStreamFailed({
      userId,
      name: user.name,
      email: user.email,
      title: title || 'Live Stream',
      reason: event.reason,
      platformName: event.platformName,
      streamId: event.streamId,
    });
  }

  // ──────────────────────────────────────────
  // 5. SOCIAL ACCOUNTS
  // ──────────────────────────────────────────

  @OnEvent('social.connected')
  async handleSocialConnected(event: {
    userId: string;
    platform: string;
    accountName: string;
    workspaceName?: string;
  }) {
    const user = await this.resolveUser(event.userId);
    if (!user) return;

    await this.mailService.sendSocialConnected({
      userId: event.userId,
      name: user.name,
      email: user.email,
      platform: event.platform,
      accountName: event.accountName,
      workspaceName: event.workspaceName,
    });
  }

  @OnEvent('social.reauth_required')
  async handleSocialReauthRequired(event: {
    userId: string;
    platform: string;
    accountName: string;
  }) {
    const user = await this.resolveUser(event.userId);
    if (!user) return;

    await this.mailService.sendSocialReauthRequired({
      userId: event.userId,
      name: user.name,
      email: user.email,
      platform: event.platform,
      accountName: event.accountName,
    });
  }

  @OnEvent('social.disconnected')
  async handleSocialDisconnected(event: {
    userId: string;
    platform: string;
    accountName: string;
    workspaceName?: string;
  }) {
    const user = await this.resolveUser(event.userId);
    if (!user) return;

    await this.mailService.sendSocialDisconnected({
      userId: event.userId,
      name: user.name,
      email: user.email,
      platform: event.platform,
      accountName: event.accountName,
      workspaceName: event.workspaceName,
    });
  }

  // ──────────────────────────────────────────
  // 6. WORKSPACE & TEAM
  // ──────────────────────────────────────────

  @OnEvent('workspace.invitation_accepted')
  async handleInvitationAccepted(event: {
    inviterUserId: string;
    acceptedUserId: string;
    workspaceName: string;
    role: string;
  }) {
    const inviter = await this.resolveUser(event.inviterUserId);
    const acceptedUser = await this.resolveUser(event.acceptedUserId);

    if (inviter && acceptedUser) {
      await this.mailService.sendWorkspaceInvitationAccepted({
        inviterUserId: event.inviterUserId,
        inviterName: inviter.name,
        inviterEmail: inviter.email,
        acceptedUserName: acceptedUser.name,
        acceptedUserEmail: acceptedUser.email,
        workspaceName: event.workspaceName,
        role: event.role,
      });
    }
  }

  @OnEvent('workspace.member_role_changed')
  async handleMemberRoleChanged(event: {
    userId: string;
    workspaceName: string;
    oldRole: string;
    newRole: string;
  }) {
    const user = await this.resolveUser(event.userId);
    if (!user) return;

    await this.mailService.sendWorkspaceMemberRoleChanged({
      userId: event.userId,
      name: user.name,
      email: user.email,
      workspaceName: event.workspaceName,
      oldRole: event.oldRole,
      newRole: event.newRole,
    });
  }

  @OnEvent('workspace.member_removed')
  async handleMemberRemoved(event: {
    userId: string;
    workspaceName: string;
  }) {
    const user = await this.resolveUser(event.userId);
    if (!user) return;

    await this.mailService.sendWorkspaceMemberRemoved({
      userId: event.userId,
      name: user.name,
      email: user.email,
      workspaceName: event.workspaceName,
    });
  }

  @OnEvent('workspace.ownership_transferred')
  async handleOwnershipTransferred(event: {
    workspaceId: string;
    workspaceName: string;
    fromUserId: string;
    toUserId: string;
  }) {
    const fromUser = await this.resolveUser(event.fromUserId);
    const toUser = await this.resolveUser(event.toUserId);

    if (toUser) {
      await this.mailService.sendWorkspaceOwnershipTransferred({
        userId: event.toUserId,
        name: toUser.name,
        email: toUser.email,
        workspaceName: event.workspaceName,
        isNewOwner: true,
        otherPartyName: fromUser?.name || 'Previous Owner',
      });
    }

    if (fromUser) {
      await this.mailService.sendWorkspaceOwnershipTransferred({
        userId: event.fromUserId,
        name: fromUser.name,
        email: fromUser.email,
        workspaceName: event.workspaceName,
        isNewOwner: false,
        otherPartyName: toUser?.name || 'New Owner',
      });
    }
  }
}
