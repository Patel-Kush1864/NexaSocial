import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

import { User } from '../../users/entities/user.entity';
import { Role } from '../../users/entities/role.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import {
  WorkspaceMember,
  WorkspaceRole,
} from '../../workspace-members/entities/workspace-member.entity';
import {
  ConnectedAccount,
  AccountStatus,
} from '../../social/entities/connected-account.entity';
import { OAuthToken } from '../../social/entities/oauth-token.entity';
import {
  SocialAccount,
  SocialAccountStatus,
} from '../../social/entities/social-account.entity';
import {
  LiveStream,
  StreamStatus,
  StreamVisibility,
} from '../../livestreams/entities/livestream.entity';
import {
  StreamPlatform,
  StreamPlatformStatus,
} from '../../stream-platforms/entities/stream-platform.entity';
import { SocialAnalyticsSnapshot } from '../../dashboard/entities/social-analytics-snapshot.entity';
import {
  Notification,
  NotificationType,
  NotificationPriority,
} from '../../notifications/entities/notification.entity';
import { ActivityLog } from '../../activity/entities/activity-log.entity';
import { Payment, PaymentStatus } from '../../payments/entities/payment.entity';
import {
  UserSubscription,
  SubscriptionStatus,
} from '../../subscriptions/entities/user-subscription.entity';
import { Plan } from '../../plans/entities/plan.entity';
import {
  Invitation,
  InvitationStatus,
} from '../../invitations/entities/invitation.entity';
import { FeatureFlag } from '../../system-settings/entities/feature-flag.entity';
import { SystemSetting } from '../../system-settings/entities/system-setting.entity';
import { SecurityEvent } from '../../security/entities/security-event.entity';
import { EmailLog, EmailStatus } from '../../mail/entities/email-log.entity';
import { AdminAuditLog } from '../../audit/entities/admin-audit-log.entity';
import { UserSession } from '../../users/entities/user-session.entity';

import { runSeed } from './seed';

export interface SeedSummary {
  users: number;
  userSessions: number;
  workspaces: number;
  workspaceMembers: number;
  subscriptions: number;
  payments: number;
  connectedAccounts: number;
  oauthTokens: number;
  socialAccounts: number;
  streams: number;
  streamPlatforms: number;
  analyticsSnapshots: number;
  notifications: number;
  activityLogs: number;
  invitations: number;
  featureFlags: number;
  systemSettings: number;
  securityEvents: number;
  emailLogs: number;
  adminAuditLogs: number;
  dateRange: string;
}

/**
 * Directly updates created_at and updated_at in MySQL to guarantee that TypeORM
 * does not override custom simulated past timestamps.
 */
async function setTimestamps(
  dataSource: DataSource,
  table: string,
  id: string,
  createdAt: Date,
  updatedAt?: Date,
): Promise<void> {
  const cStr = createdAt.toISOString().slice(0, 19).replace('T', ' ');
  const uStr = (updatedAt || createdAt)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');
  await dataSource.query(
    `UPDATE \`${table}\` SET \`created_at\` = ?, \`updated_at\` = ? WHERE \`id\` = ?`,
    [cStr, uStr, id],
  );
}

function daysAgo(days: number, hoursOffset = 0, minutesOffset = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hoursOffset, d.getMinutes() - minutesOffset, 0, 0);
  return d;
}

export async function seedRandomData(
  dataSource: DataSource,
  options: { fresh?: boolean; daysSpan?: number } = {},
): Promise<SeedSummary> {
  const daysSpan = options.daysSpan || 90;
  console.log(
    `🚀 Starting random data seeding across different dates (spanning past ${daysSpan} days)...`,
  );

  // Optional database reset if fresh mode requested
  if (options.fresh) {
    console.log('🧹 Fresh mode requested: Truncating existing tables...');
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0;');
    const tables: Array<{ TABLE_NAME?: string; table_name?: string }> =
      await dataSource.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = (SELECT DATABASE());
      `);
    for (const t of tables) {
      const name = t.TABLE_NAME || t.table_name;
      if (name && name !== 'migrations') {
        await dataSource.query(`TRUNCATE TABLE \`${name}\`;`);
      }
    }
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('✨ All tables truncated successfully.');
  }

  // 1. Ensure prerequisite foundational records exist (Roles, Permissions, Plans, Platforms, Admin)
  await runSeed(dataSource);

  const roleRepo = dataSource.getRepository(Role);
  const planRepo = dataSource.getRepository(Plan);
  const userRepo = dataSource.getRepository(User);
  const workspaceRepo = dataSource.getRepository(Workspace);
  const memberRepo = dataSource.getRepository(WorkspaceMember);
  const subscriptionRepo = dataSource.getRepository(UserSubscription);
  const connectedAccountRepo = dataSource.getRepository(ConnectedAccount);
  const oauthTokenRepo = dataSource.getRepository(OAuthToken);
  const socialAccountRepo = dataSource.getRepository(SocialAccount);
  const liveStreamRepo = dataSource.getRepository(LiveStream);
  const streamPlatformRepo = dataSource.getRepository(StreamPlatform);
  const analyticsSnapshotRepo = dataSource.getRepository(
    SocialAnalyticsSnapshot,
  );
  const notificationRepo = dataSource.getRepository(Notification);
  const activityLogRepo = dataSource.getRepository(ActivityLog);
  const paymentRepo = dataSource.getRepository(Payment);
  const invitationRepo = dataSource.getRepository(Invitation);
  const featureFlagRepo = dataSource.getRepository(FeatureFlag);
  const systemSettingRepo = dataSource.getRepository(SystemSetting);
  const securityEventRepo = dataSource.getRepository(SecurityEvent);
  const emailLogRepo = dataSource.getRepository(EmailLog);
  const adminAuditLogRepo = dataSource.getRepository(AdminAuditLog);
  const userSessionRepo = dataSource.getRepository(UserSession);

  // Fetch available roles and plans
  const roles = await roleRepo.find();
  const plans = await planRepo.find({ where: { isActive: true } });

  const ownerRole = roles.find((r) => r.name === 'WORKSPACE_OWNER') || roles[0];
  const managerRole = roles.find((r) => r.name === 'MANAGER') || ownerRole;
  const creatorRole = roles.find((r) => r.name === 'CREATOR') || ownerRole;
  const viewerRole = roles.find((r) => r.name === 'VIEWER') || creatorRole;

  const proPlan = plans.find((p) => p.code === 'pro') || plans[0];
  const starterPlan = plans.find((p) => p.code === 'starter') || plans[0];
  const enterprisePlan =
    plans.find((p) => p.code === 'enterprise') || plans[plans.length - 1];

  const defaultPassword = 'Password123!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // 2. Seed Users with staggered creation dates across past 90 days
  console.log('👤 Seeding Users distributed across different dates...');
  const userDefinitions = [
    {
      email: 'demo@nexasocial.com',
      firstName: 'Alex',
      lastName: 'Vance',
      phoneNumber: '+14155552671',
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
      role: ownerRole,
      createdDaysAgo: 88,
    },
    {
      email: 'sarah.creator@nexasocial.com',
      firstName: 'Sarah',
      lastName: 'Chen',
      phoneNumber: '+14155553812',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80',
      role: creatorRole,
      createdDaysAgo: 76,
    },
    {
      email: 'marcus.stream@nexasocial.com',
      firstName: 'Marcus',
      lastName: 'Brody',
      phoneNumber: '+14155559044',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
      role: managerRole,
      createdDaysAgo: 63,
    },
    {
      email: 'elena.rostova@nexasocial.com',
      firstName: 'Elena',
      lastName: 'Rostova',
      phoneNumber: '+14155557788',
      avatar:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&h=256&q=80',
      role: ownerRole,
      createdDaysAgo: 51,
    },
    {
      email: 'david.kim@nexasocial.com',
      firstName: 'David',
      lastName: 'Kim',
      phoneNumber: '+14155554321',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
      role: viewerRole,
      createdDaysAgo: 42,
    },
    {
      email: 'priya.sharma@nexasocial.com',
      firstName: 'Priya',
      lastName: 'Sharma',
      phoneNumber: '+14155558910',
      avatar:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80',
      role: managerRole,
      createdDaysAgo: 34,
    },
    {
      email: 'jordan.lee@nexasocial.com',
      firstName: 'Jordan',
      lastName: 'Lee',
      phoneNumber: '+14155556214',
      avatar:
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80',
      role: creatorRole,
      createdDaysAgo: 27,
    },
    {
      email: 'maya.patel@nexasocial.com',
      firstName: 'Maya',
      lastName: 'Patel',
      phoneNumber: '+14155551984',
      avatar:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&h=256&q=80',
      role: viewerRole,
      createdDaysAgo: 19,
    },
    {
      email: 'lucas.silva@nexasocial.com',
      firstName: 'Lucas',
      lastName: 'Silva',
      phoneNumber: '+14155557349',
      avatar:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80',
      role: creatorRole,
      createdDaysAgo: 12,
    },
    {
      email: 'chloe.dupont@nexasocial.com',
      firstName: 'Chloe',
      lastName: 'Dupont',
      phoneNumber: '+14155558231',
      avatar:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80',
      role: managerRole,
      createdDaysAgo: 6,
    },
    {
      email: 'hassan.malik@nexasocial.com',
      firstName: 'Hassan',
      lastName: 'Malik',
      phoneNumber: '+14155559123',
      avatar:
        'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&h=256&q=80',
      role: viewerRole,
      createdDaysAgo: 2,
    },
  ];

  const seededUsers: User[] = [];
  for (const def of userDefinitions) {
    let user = await userRepo.findOne({ where: { email: def.email } });
    if (!user) {
      user = userRepo.create({
        email: def.email,
        firstName: def.firstName,
        lastName: def.lastName,
        phoneNumber: def.phoneNumber,
        avatar: def.avatar,
        password: hashedPassword,
        status: 'ACTIVE',
        isActive: true,
        isEmailVerified: true,
        role: def.role,
      });
      user = await userRepo.save(user);
    }
    // Update created_at to past date
    await setTimestamps(
      dataSource,
      'users',
      user.id,
      daysAgo(def.createdDaysAgo),
    );
    seededUsers.push(user);
  }

  // 3. Seed User Sessions (recent activity across past 14 days)
  for (let i = 0; i < seededUsers.length; i++) {
    const user = seededUsers[i];
    const sessionDate = daysAgo(Math.min(14, (i * 2) % 14), (i * 3) % 24);
    let session = await userSessionRepo.findOne({ where: { userId: user.id } });
    if (!session) {
      session = userSessionRepo.create({
        userId: user.id,
        refreshTokenHash: faker.string.alphanumeric(64),
        device: faker.helpers.arrayElement([
          'MacBook Pro 16"',
          'Windows 11 PC',
          'iPhone 15 Pro',
          'iPad Air',
        ]),
        browser: faker.helpers.arrayElement([
          'Chrome 131.0',
          'Firefox 133.0',
          'Safari 18.1',
          'Edge 131.0',
        ]),
        ipAddress: faker.internet.ipv4(),
        expiresAt: faker.date.future({ years: 1 }),
      });
      session = await userSessionRepo.save(session);
    }
    await setTimestamps(dataSource, 'user_sessions', session.id, sessionDate);
  }

  // 4. Seed Workspaces created on different past dates
  console.log(
    '🏢 Seeding Workspaces & Members with different creation dates...',
  );
  const workspaceDefinitions = [
    {
      name: 'Apex Media Studio',
      slug: 'apex-media',
      description:
        'Primary production hub for daily live broadcasts and multi-platform syndication.',
      owner: seededUsers[0],
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=128&h=128&q=80',
      createdDaysAgo: 88,
    },
    {
      name: 'CyberPulse Live',
      slug: 'cyberpulse-live',
      description:
        'Esports, gaming live streams, community tournaments and interactive watch parties.',
      owner: seededUsers[1],
      logo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=128&h=128&q=80',
      createdDaysAgo: 70,
    },
    {
      name: 'Global Tech Insights',
      slug: 'global-tech',
      description:
        'Deep-dive developer keynotes, tech news, and live architecture reviews.',
      owner: seededUsers[3],
      logo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=128&h=128&q=80',
      createdDaysAgo: 45,
    },
    {
      name: 'Creative Syndicate Lab',
      slug: 'creative-syndicate',
      description:
        'Creative audio-video experimentation and podcast syndication network.',
      owner: seededUsers[0],
      logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=128&h=128&q=80',
      createdDaysAgo: 22,
    },
  ];

  const seededWorkspaces: Workspace[] = [];
  for (const def of workspaceDefinitions) {
    let ws = await workspaceRepo.findOne({ where: { slug: def.slug } });
    if (!ws) {
      ws = workspaceRepo.create({
        name: def.name,
        slug: def.slug,
        description: def.description,
        ownerId: def.owner.id,
        status: 'ACTIVE',
        timezone: 'UTC',
        logo: def.logo,
        settings: {
          language: 'en',
          defaultPlatform: 'YOUTUBE',
          notificationPreferences: {
            streamAlerts: true,
            billingUpdates: true,
            teamInvites: true,
          },
        },
      });
      ws = await workspaceRepo.save(ws);
    }
    await setTimestamps(
      dataSource,
      'workspaces',
      ws.id,
      daysAgo(def.createdDaysAgo),
    );
    seededWorkspaces.push(ws);
  }

  // 5. Seed Workspace Members with staggered joined_at timestamps
  for (const ws of seededWorkspaces) {
    const wsCreatedAt = daysAgo(
      workspaceDefinitions.find((w) => w.slug === ws.slug)?.createdDaysAgo ||
      30,
    );

    // Owner member
    let ownerMember = await memberRepo.findOne({
      where: { workspaceId: ws.id, userId: ws.ownerId },
    });
    if (!ownerMember) {
      ownerMember = memberRepo.create({
        workspaceId: ws.id,
        userId: ws.ownerId,
        role: WorkspaceRole.OWNER,
        joinedAt: wsCreatedAt,
      });
      ownerMember = await memberRepo.save(ownerMember);
    }
    await setTimestamps(
      dataSource,
      'workspace_members',
      ownerMember.id,
      wsCreatedAt,
    );

    // Add other members to workspace with progressive join dates
    const otherUsers = seededUsers.filter((u) => u.id !== ws.ownerId);
    for (let i = 0; i < Math.min(4, otherUsers.length); i++) {
      const u = otherUsers[i];
      const memberJoinDate = new Date(
        wsCreatedAt.getTime() + (i + 1) * 3 * 86400000,
      );
      let member = await memberRepo.findOne({
        where: { workspaceId: ws.id, userId: u.id },
      });
      if (!member) {
        const assignedRole =
          i === 0
            ? WorkspaceRole.MANAGER
            : i === 1
              ? WorkspaceRole.CREATOR
              : WorkspaceRole.VIEWER;
        member = memberRepo.create({
          workspaceId: ws.id,
          userId: u.id,
          role: assignedRole,
          invitedBy: ws.ownerId,
          joinedAt: memberJoinDate,
        });
        member = await memberRepo.save(member);
      }
      await setTimestamps(
        dataSource,
        'workspace_members',
        member.id,
        memberJoinDate,
      );
    }
  }

  // 6. Seed User Subscriptions & Payments across multiple billing cycles (past 90 days)
  console.log(
    '💳 Seeding Subscriptions & Recurring Payments across multiple months...',
  );
  for (let i = 0; i < seededUsers.length; i++) {
    const user = seededUsers[i];
    const plan = i === 0 ? enterprisePlan : i % 2 === 0 ? proPlan : starterPlan;
    const initialDaysAgo = userDefinitions[i]?.createdDaysAgo || 30;

    let sub = await subscriptionRepo.findOne({ where: { userId: user.id } });
    const subStartDate = daysAgo(initialDaysAgo);
    const subEndDate = new Date(subStartDate);
    subEndDate.setFullYear(subEndDate.getFullYear() + 1);

    if (!sub) {
      sub = subscriptionRepo.create({
        userId: user.id,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: subStartDate,
        endDate: subEndDate,
        stripeSubscriptionId: `sub_test_${faker.string.alphanumeric(14)}`,
        stripeCustomerId: `cus_test_${faker.string.alphanumeric(14)}`,
      });
      sub = await subscriptionRepo.save(sub);
    }
    await setTimestamps(dataSource, 'user_subscriptions', sub.id, subStartDate);

    // Generate monthly recurring payment records (e.g. Month 1, Month 2, Month 3)
    const cyclesCount = Math.floor(initialDaysAgo / 30) + 1;
    for (let cycle = 0; cycle < cyclesCount; cycle++) {
      const paymentDate = daysAgo(Math.max(1, initialDaysAgo - cycle * 30));
      const paymentIdentifier = `pi_cycle_${user.id.slice(0, 8)}_${cycle}`;

      let payment = await paymentRepo.findOne({
        where: { gatewayPaymentId: paymentIdentifier },
      });
      if (!payment) {
        payment = paymentRepo.create({
          userId: user.id,
          subscriptionId: sub.id,
          planId: plan.id,
          amount: plan.price || 999.0,
          currency: plan.currency || 'INR',
          status: PaymentStatus.SUCCESS,
          gateway: cycle % 2 === 0 ? 'STRIPE' : 'RAZORPAY',
          gatewayPaymentId: paymentIdentifier,
          gatewayOrderId: `ord_test_${faker.string.alphanumeric(14)}`,
          metadata: {
            cycle: cycle + 1,
            invoiceNumber: `INV-2026-${faker.number.int({ min: 1000, max: 9999 })}`,
            billingDate: paymentDate.toISOString().split('T')[0],
          },
        });
        payment = await paymentRepo.save(payment);
      }
      await setTimestamps(dataSource, 'payments', payment.id, paymentDate);
    }
  }

  // 7. Seed Connected Accounts & OAuth Tokens with staggered connection dates
  console.log('🔗 Seeding Connected Accounts on different dates...');
  const platformConfigs = [
    {
      platformName: 'YOUTUBE',
      nameSuffix: 'YouTube Channel',
      avatar:
        'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=128&h=128&q=80',
    },
    {
      platformName: 'FACEBOOK',
      nameSuffix: 'Facebook Page',
      avatar:
        'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=128&h=128&q=80',
    },
    {
      platformName: 'INSTAGRAM',
      nameSuffix: 'Instagram Live',
      avatar:
        'https://images.unsplash.com/photo-1611262588024-d12430b98920?auto=format&fit=crop&w=128&h=128&q=80',
    },
    {
      platformName: 'X',
      nameSuffix: 'X Studio Stream',
      avatar:
        'https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&w=128&h=128&q=80',
    },
  ];

  const seededConnectedAccounts: ConnectedAccount[] = [];
  for (let wIdx = 0; wIdx < seededWorkspaces.length; wIdx++) {
    const ws = seededWorkspaces[wIdx];
    const wsDaysAgo = workspaceDefinitions[wIdx]?.createdDaysAgo || 40;

    for (let pIdx = 0; pIdx < platformConfigs.length; pIdx++) {
      const pConfig = platformConfigs[pIdx];
      const accountDate = daysAgo(Math.max(2, wsDaysAgo - pIdx * 3));

      let acc = await connectedAccountRepo.findOne({
        where: { workspaceId: ws.id, platformName: pConfig.platformName },
      });

      if (!acc) {
        acc = connectedAccountRepo.create({
          workspaceId: ws.id,
          platformName: pConfig.platformName,
          platformUserId: faker.string.numeric(16),
          name: `${ws.name} - ${pConfig.nameSuffix}`,
          avatar: pConfig.avatar,
          status: AccountStatus.CONNECTED,
          metadata: {
            channelUrl: `https://${pConfig.platformName.toLowerCase()}.com/@${ws.slug}`,
            subscribers: faker.number.int({ min: 14000, max: 185000 }),
            verified: true,
          },
        });
        acc = await connectedAccountRepo.save(acc);

        const token = oauthTokenRepo.create({
          connectedAccountId: acc.id,
          accessToken: `ya29.${faker.string.alphanumeric(48)}`,
          refreshToken: `1//${faker.string.alphanumeric(40)}`,
          tokenType: 'Bearer',
          scope: 'read write stream publish',
          expiresAt: faker.date.future({ years: 1 }),
        });
        await oauthTokenRepo.save(token);
        await setTimestamps(dataSource, 'oauth_tokens', token.id, accountDate);
      }
      await setTimestamps(
        dataSource,
        'connected_accounts',
        acc.id,
        accountDate,
      );
      seededConnectedAccounts.push(acc);
    }
  }

  // 8. Seed Social Accounts with matching user dates
  for (let i = 0; i < seededUsers.length; i++) {
    const user = seededUsers[i];
    const joinDate = daysAgo(userDefinitions[i]?.createdDaysAgo || 20);
    let socialAcc = await socialAccountRepo.findOne({
      where: { userId: user.id },
    });
    if (!socialAcc) {
      socialAcc = socialAccountRepo.create({
        userId: user.id,
        provider: 'google',
        providerUserId: faker.string.numeric(21),
        providerName: `${user.firstName} ${user.lastName}`,
        providerEmail: user.email,
        connected: true,
        status: SocialAccountStatus.CONNECTED,
        connectedAt: joinDate,
        scopes: 'profile email https://www.googleapis.com/auth/youtube',
      });
      socialAcc = await socialAccountRepo.save(socialAcc);
    }
    await setTimestamps(dataSource, 'social_accounts', socialAcc.id, joinDate);
  }

  // 9. Seed 60-Day Historical Analytics Snapshots (one snapshot per day per platform)
  console.log(
    '📈 Seeding 60 days of consecutive Social Analytics Snapshots...',
  );
  const targetPlatforms = ['YOUTUBE', 'FACEBOOK', 'INSTAGRAM', 'X'];

  for (const ws of seededWorkspaces) {
    const wsAccounts = seededConnectedAccounts.filter(
      (a) => a.workspaceId === ws.id,
    );

    for (const platform of targetPlatforms) {
      const matchingAccount = wsAccounts.find(
        (a) => a.platformName === platform,
      );

      let currentFollowers =
        platform === 'YOUTUBE'
          ? 38000
          : platform === 'INSTAGRAM'
            ? 28500
            : platform === 'FACEBOOK'
              ? 16200
              : 22400;

      for (let dayOffset = 59; dayOffset >= 0; dayOffset--) {
        const snapDate = daysAgo(dayOffset);
        const snapshotDateStr = snapDate.toISOString().split('T')[0];

        currentFollowers += faker.number.int({ min: 20, max: 140 });
        const engagement = faker.number.int({ min: 720, max: 4950 });

        let snapshot = await analyticsSnapshotRepo.findOne({
          where: {
            workspaceId: ws.id,
            platformName: platform,
            snapshotDate: snapshotDateStr,
          },
        });

        if (!snapshot) {
          snapshot = analyticsSnapshotRepo.create({
            workspaceId: ws.id,
            connectedAccountId: matchingAccount?.id,
            platformName: platform,
            followers: currentFollowers,
            engagement,
            snapshotDate: snapshotDateStr,
          });
          snapshot = await analyticsSnapshotRepo.save(snapshot);
        }
        await setTimestamps(
          dataSource,
          'social_analytics_snapshots',
          snapshot.id,
          snapDate,
        );
      }
    }
  }

  // 10. Seed 24 Live Streams spread across 24 different dates (past 85 days to today + upcoming)
  console.log(
    '🎥 Seeding Live Streams & Stream Platforms distributed across 24 distinct dates...',
  );
  const streamDefinitions = [
    // Currently LIVE (Today)
    {
      title: '🔴 Tech Innovations & AI Architecture Keynote 2026',
      description:
        'Live interactive keynote covering cloud-native multi-destination syndication and WebRTC low-latency streaming.',
      status: StreamStatus.LIVE,
      daysAgoStart: 0,
      hoursAgoStart: 1,
      durationHours: null,
      thumbnail:
        'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=640&h=360&q=80',
    },
    {
      title: '🔴 24/7 Lo-Fi Chill Coding & Community Hangout',
      description:
        'Ambient programming vibes, building real-time dashboard widgets with TypeScript and NestJS.',
      status: StreamStatus.LIVE,
      daysAgoStart: 0,
      hoursAgoStart: 3,
      durationHours: null,
      thumbnail:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=640&h=360&q=80',
    },
    // Past ENDED Streams across different dates
    {
      title: 'Interactive Q&A: Full-Stack Video Ingest & Edge CDN',
      description:
        'Deep dive into RTMP protocol handshakes, SRT ingest, and worldwide edge CDN delivery.',
      status: StreamStatus.ENDED,
      daysAgoStart: 1,
      hoursAgoStart: 4,
      durationHours: 1.5,
      thumbnail:
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=640&h=360&q=80',
    },
    {
      title: 'Next-Gen Video Encoding: AV1 vs H.264 Benchmark',
      description:
        'Detailed analysis of bitrate efficiency, transcode speeds, and CPU utilization across distributed RTMP relays.',
      status: StreamStatus.ENDED,
      daysAgoStart: 3,
      hoursAgoStart: 2,
      durationHours: 2,
      thumbnail:
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=640&h=360&q=80',
    },
    {
      title: 'Mastering Cross-Platform Social Distribution',
      description:
        'Proven workflows to simultaneously broadcast to YouTube, Facebook, and Instagram with high audience retention.',
      status: StreamStatus.ENDED,
      daysAgoStart: 6,
      hoursAgoStart: 5,
      durationHours: 1.75,
      thumbnail:
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=640&h=360&q=80',
    },
    {
      title: 'Live Coding: Designing Responsive Studio Analytics',
      description:
        'Hands-on tutorial building real-time telemetry gauges and exportable CSV reports.',
      status: StreamStatus.ENDED,
      daysAgoStart: 10,
      hoursAgoStart: 3,
      durationHours: 2.25,
      thumbnail:
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=640&h=360&q=80',
    },
    {
      title: 'Creator Economy 2026: Monetization & Fan Subscriptions',
      description:
        'Fireside conversation with industry veterans discussing platform algorithm shifts and sponsorship funnels.',
      status: StreamStatus.ENDED,
      daysAgoStart: 15,
      hoursAgoStart: 6,
      durationHours: 1.5,
      thumbnail:
        'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=640&h=360&q=80',
    },
    {
      title: 'Apex Esports League: Regional Qualifier Matches',
      description:
        'High-octane competitive gaming finals broadcast live with multi-camera perspective switching.',
      status: StreamStatus.ENDED,
      daysAgoStart: 21,
      hoursAgoStart: 8,
      durationHours: 3.5,
      thumbnail:
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=640&h=360&q=80',
    },
    {
      title: 'State of Social Streaming: Winter Industry Benchmark',
      description:
        'Comprehensive quarterly report breakdown analyzing live stream view trends across platforms.',
      status: StreamStatus.ENDED,
      daysAgoStart: 28,
      hoursAgoStart: 4,
      durationHours: 1.25,
      thumbnail:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=640&h=360&q=80',
    },
    {
      title: 'Distributed Transcoding Nodes: Low-Cost Scalability',
      description:
        'How to scale live media processing across multi-region server clusters without latency bottlenecks.',
      status: StreamStatus.ENDED,
      daysAgoStart: 36,
      hoursAgoStart: 3,
      durationHours: 2,
      thumbnail:
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=640&h=360&q=80',
    },
    {
      title: 'Podcast Studio Live Recording: The Future of Media',
      description:
        'Live studio session recording episodes 42 and 43 of the Digital Broadcast podcast series.',
      status: StreamStatus.ENDED,
      daysAgoStart: 45,
      hoursAgoStart: 5,
      durationHours: 1.8,
      thumbnail:
        'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=640&h=360&q=80',
    },
    {
      title: 'Audio Engineering Essentials: Mastering Stream Sound',
      description:
        'Dynamic range compression, noise gating, and spatial audio mastering for live broadcasts.',
      status: StreamStatus.ENDED,
      daysAgoStart: 55,
      hoursAgoStart: 2,
      durationHours: 1.6,
      thumbnail:
        'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=640&h=360&q=80',
    },
    {
      title: 'Creator Community Showcase: Best Broadcast Setups',
      description:
        'Reviewing home and professional creator studios from our worldwide community members.',
      status: StreamStatus.ENDED,
      daysAgoStart: 66,
      hoursAgoStart: 4,
      durationHours: 2.1,
      thumbnail:
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=640&h=360&q=80',
    },
    {
      title: 'Launch Event: NexaSocial Studio V1 Beta Release',
      description:
        'First public live demonstration of our multi-platform social streaming control room.',
      status: StreamStatus.ENDED,
      daysAgoStart: 80,
      hoursAgoStart: 6,
      durationHours: 2.5,
      thumbnail:
        'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=640&h=360&q=80',
    },
    // Scheduled (Future Streams)
    {
      title: 'Upcoming: Global Developer Summit 2026 - Day 1',
      description:
        'Day 1 developer keynotes and technical workshops streaming live worldwide.',
      status: StreamStatus.SCHEDULED,
      daysAgoStart: -2, // In 2 days
      hoursAgoStart: 0,
      durationHours: null,
      thumbnail:
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=640&h=360&q=80',
    },
    {
      title: 'Upcoming: Friday Night Gaming Tournament Finals',
      description:
        'Grand finals tournament stream featuring top community creators and pro esports competitors.',
      status: StreamStatus.SCHEDULED,
      daysAgoStart: -5, // In 5 days
      hoursAgoStart: 0,
      durationHours: null,
      thumbnail:
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=640&h=360&q=80',
    },
  ];

  for (const ws of seededWorkspaces) {
    const wsAccounts = seededConnectedAccounts.filter(
      (a) => a.workspaceId === ws.id,
    );

    for (const sDef of streamDefinitions) {
      const streamStartDate =
        sDef.daysAgoStart >= 0
          ? daysAgo(sDef.daysAgoStart, sDef.hoursAgoStart)
          : new Date(Date.now() + Math.abs(sDef.daysAgoStart) * 86400000);

      const streamEndDate =
        sDef.durationHours !== null
          ? new Date(streamStartDate.getTime() + sDef.durationHours * 3600000)
          : undefined;

      const scheduledDate =
        sDef.status === StreamStatus.SCHEDULED ? streamStartDate : undefined;

      let stream = await liveStreamRepo.findOne({
        where: { workspaceId: ws.id, title: sDef.title },
      });

      if (!stream) {
        stream = liveStreamRepo.create({
          workspaceId: ws.id,
          title: sDef.title,
          description: sDef.description,
          thumbnail: sDef.thumbnail,
          status: sDef.status,
          visibility: StreamVisibility.PUBLIC,
          startedAt:
            sDef.status !== StreamStatus.SCHEDULED
              ? streamStartDate
              : undefined,
          endedAt: streamEndDate,
          scheduledAt: scheduledDate,
          createdBy: ws.ownerId,
        });
        stream = await liveStreamRepo.save(stream);

        // Attach stream platforms
        for (const account of wsAccounts) {
          const platformStatus =
            sDef.status === StreamStatus.LIVE
              ? StreamPlatformStatus.LIVE
              : sDef.status === StreamStatus.ENDED
                ? StreamPlatformStatus.ENDED
                : StreamPlatformStatus.CONFIGURED;

          const sp = streamPlatformRepo.create({
            streamId: stream.id,
            connectedAccountId: account.id,
            streamKey: `live_${faker.string.alphanumeric(24)}`,
            streamUrl: `rtmp://live.${account.platformName.toLowerCase()}.com/live2`,
            platformStreamId: faker.string.numeric(12),
            viewerUrl: `https://${account.platformName.toLowerCase()}.com/watch?v=${faker.string.alphanumeric(11)}`,
            status: platformStatus,
            sourceStatus:
              sDef.status === StreamStatus.LIVE ? 'CONNECTED' : 'DISCONNECTED',
            publishStatus:
              sDef.status === StreamStatus.LIVE ? 'TRANSMITTING' : 'IDLE',
            publishedAt:
              sDef.status !== StreamStatus.SCHEDULED
                ? streamStartDate
                : undefined,
            sourceConnectedAt: streamStartDate,
          });
          await streamPlatformRepo.save(sp);
          await setTimestamps(
            dataSource,
            'stream_platforms',
            sp.id,
            streamStartDate,
          );
        }
      }
      await setTimestamps(
        dataSource,
        'live_streams',
        stream.id,
        streamStartDate,
      );
    }
  }

  // 11. Seed Notifications spread across past 30 days
  console.log('🔔 Seeding Notifications across different dates...');
  const notifConfigs = [
    {
      daysAgo: 0,
      title: 'Broadcast Session Active',
      message: 'Your stream is live on 4 destinations.',
      type: NotificationType.STREAM_STARTED,
      prio: NotificationPriority.HIGH,
    },
    {
      daysAgo: 1,
      title: 'Stream Ended Successfully',
      message: 'Stream session completed. Duration: 1h 30m.',
      type: NotificationType.STREAM_ENDED,
      prio: NotificationPriority.LOW,
    },
    {
      daysAgo: 3,
      title: 'Subscription Renewed',
      message: 'Pro Plan monthly subscription renewed successfully.',
      type: NotificationType.PAYMENT_SUCCESS,
      prio: NotificationPriority.LOW,
    },
    {
      daysAgo: 7,
      title: 'Team Member Joined',
      message: 'Sarah Chen accepted your invitation.',
      type: NotificationType.MEMBER_JOINED,
      prio: NotificationPriority.MEDIUM,
    },
    {
      daysAgo: 14,
      title: 'YouTube OAuth Refreshed',
      message: 'Channel streaming credentials refreshed.',
      type: NotificationType.UPDATE,
      prio: NotificationPriority.LOW,
    },
    {
      daysAgo: 21,
      title: 'Network Maintenance Notice',
      message: 'Edge nodes upgraded without downtime.',
      type: NotificationType.ANNOUNCEMENT,
      prio: NotificationPriority.MEDIUM,
    },
    {
      daysAgo: 30,
      title: 'Welcome to NexaSocial',
      message: 'Your studio workspace was created successfully.',
      type: NotificationType.GENERAL,
      prio: NotificationPriority.LOW,
    },
  ];

  for (const user of seededUsers) {
    for (const nc of notifConfigs) {
      const nDate = daysAgo(nc.daysAgo, (seededUsers.indexOf(user) * 2) % 24);
      let notif = await notificationRepo.findOne({
        where: { userId: user.id, title: nc.title },
      });
      if (!notif) {
        notif = notificationRepo.create({
          userId: user.id,
          workspaceId: seededWorkspaces[0].id,
          title: nc.title,
          message: nc.message,
          type: nc.type,
          priority: nc.prio,
          isRead: nc.daysAgo > 2,
        });
        notif = await notificationRepo.save(notif);
      }
      await setTimestamps(dataSource, 'notifications', notif.id, nDate);
    }
  }

  // 12. Seed Activity Logs across past 60 days
  console.log('📋 Seeding Activity Logs across different dates...');
  const activityConfigs = [
    {
      daysAgo: 0,
      action: 'STREAM_STARTED',
      desc: 'Started live broadcast on 4 platforms.',
    },
    {
      daysAgo: 1,
      action: 'STREAM_ENDED',
      desc: 'Ended live broadcast. Final duration: 1h 30m.',
    },
    {
      daysAgo: 3,
      action: 'PAYMENT_COMPLETED',
      desc: 'Processed monthly recurring plan fee.',
    },
    {
      daysAgo: 6,
      action: 'STREAM_STARTED',
      desc: 'Broadcasted live community masterclass.',
    },
    {
      daysAgo: 10,
      action: 'WORKSPACE_UPDATED',
      desc: 'Updated default streaming destinations.',
    },
    {
      daysAgo: 15,
      action: 'MEMBER_INVITED',
      desc: 'Sent collaborator invite to creator.',
    },
    {
      daysAgo: 22,
      action: 'SOCIAL_ACCOUNT_CONNECTED',
      desc: 'Verified and linked YouTube streaming channel.',
    },
    {
      daysAgo: 35,
      action: 'PLAN_UPGRADED',
      desc: 'Upgraded workspace plan to Pro Tier.',
    },
    {
      daysAgo: 50,
      action: 'STREAM_STARTED',
      desc: 'First studio trial broadcast test.',
    },
    {
      daysAgo: 60,
      action: 'WORKSPACE_CREATED',
      desc: 'Created studio workspace and set timezone.',
    },
  ];

  for (const ws of seededWorkspaces) {
    for (const ac of activityConfigs) {
      const aDate = daysAgo(ac.daysAgo);
      let log = await activityLogRepo.findOne({
        where: { workspaceId: ws.id, action: ac.action, description: ac.desc },
      });
      if (!log) {
        log = activityLogRepo.create({
          workspaceId: ws.id,
          userId: ws.ownerId,
          action: ac.action,
          description: ac.desc,
          metadata: {
            timestamp: aDate.toISOString(),
            ip: faker.internet.ipv4(),
          },
        });
        log = await activityLogRepo.save(log);
      }
      await setTimestamps(dataSource, 'activity_logs', log.id, aDate);
    }
  }

  // 13. Seed Invitations across past 30 days
  console.log('✉️ Seeding Invitations across different dates...');
  for (let i = 0; i < seededWorkspaces.length; i++) {
    const ws = seededWorkspaces[i];
    const invDate = daysAgo(i * 7 + 2);
    let inv = await invitationRepo.findOne({ where: { workspaceId: ws.id } });
    if (!inv) {
      inv = invitationRepo.create({
        workspaceId: ws.id,
        invitedById: ws.ownerId,
        email: `collaborator_${ws.slug}@example.com`,
        role: WorkspaceRole.CREATOR,
        token: faker.string.alphanumeric(32),
        status:
          i % 2 === 0 ? InvitationStatus.ACCEPTED : InvitationStatus.PENDING,
        expiresAt: faker.date.future({ years: 1 }),
      });
      inv = await invitationRepo.save(inv);
    }
    await setTimestamps(dataSource, 'workspace_invitations', inv.id, invDate);
  }

  // 14. Seed Feature Flags & System Settings
  const flags = [
    {
      name: 'AI_CAPTIONS',
      isEnabled: true,
      description: 'Live automated speech-to-text captions generator.',
    },
    {
      name: 'MULTI_STREAMING',
      isEnabled: true,
      description: 'Broadcast simultaneously to up to 10 social destinations.',
    },
    {
      name: 'FOUR_K_TRANSCODING',
      isEnabled: true,
      description: '4K Ultra-HD 60fps hardware transcode pipeline.',
    },
    {
      name: 'ADVANCED_ANALYTICS',
      isEnabled: true,
      description:
        'Cross-platform audience retention and viewer telemetry graphs.',
    },
    {
      name: 'BETA_STUDIO',
      isEnabled: false,
      description:
        'Experimental in-browser web studio with audio mixing console.',
    },
  ];
  for (const f of flags) {
    let flag = await featureFlagRepo.findOne({ where: { name: f.name } });
    if (!flag) {
      flag = featureFlagRepo.create(f);
      await featureFlagRepo.save(flag);
    }
    await setTimestamps(dataSource, 'feature_flags', flag.id, daysAgo(88));
  }

  const settings = [
    {
      key: 'APP_NAME',
      value: 'NexaSocial',
      description: 'Platform application display name.',
    },
    {
      key: 'APP_URL',
      value: 'http://localhost:3000',
      description: 'Web client frontend base URL.',
    },
    {
      key: 'DEFAULT_CURRENCY',
      value: 'INR',
      description: 'Default billing and checkout currency.',
    },
    {
      key: 'MAINTENANCE_MODE',
      value: 'false',
      description: 'System-wide maintenance banner toggle.',
    },
    {
      key: 'MAX_STREAM_BITRATE_KBPS',
      value: '12000',
      description: 'Maximum permitted RTMP video ingest bitrate.',
    },
  ];
  for (const s of settings) {
    let setting = await systemSettingRepo.findOne({ where: { key: s.key } });
    if (!setting) {
      setting = systemSettingRepo.create(s);
      await systemSettingRepo.save(setting);
    }
    await setTimestamps(dataSource, 'system_settings', setting.id, daysAgo(88));
  }

  // 15. Seed Security Events across past 45 days
  console.log('🛡️ Seeding Security Events across different dates...');
  const securityEventNames = [
    'USER_LOGIN_SUCCESS',
    'OAUTH_TOKEN_REFRESHED',
    'PASSWORD_CHANGED',
    'API_KEY_CREATED',
  ];
  for (let i = 0; i < seededUsers.length; i++) {
    const user = seededUsers[i];
    for (let eIdx = 0; eIdx < securityEventNames.length; eIdx++) {
      const evtName = securityEventNames[eIdx];
      const eDate = daysAgo(eIdx * 10 + (i % 5));
      let evt = await securityEventRepo.findOne({
        where: { userId: user.id, event: evtName },
      });
      if (!evt) {
        evt = securityEventRepo.create({
          event: evtName,
          severity: 'INFO',
          userId: user.id,
          userEmail: user.email,
          ipAddress: faker.internet.ipv4(),
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        });
        evt = await securityEventRepo.save(evt);
      }
      await setTimestamps(dataSource, 'security_events', evt.id, eDate);
    }
  }

  // 16. Seed Email Logs across past 60 days
  console.log('📧 Seeding Email Logs across different dates...');
  const emailEvents = [
    {
      eventType: 'WELCOME_EMAIL',
      subject: 'Welcome to NexaSocial - Start Broadcasting Live',
      daysAgo: 60,
    },
    {
      eventType: 'STREAM_LIVE_ALERT',
      subject: '🔴 Your Multi-Destination Stream is Live',
      daysAgo: 10,
    },
    {
      eventType: 'INVOICE_RECEIPT',
      subject: 'Your NexaSocial Payment Receipt & Tax Invoice',
      daysAgo: 30,
    },
  ];
  for (const user of seededUsers) {
    for (const e of emailEvents) {
      const emDate = daysAgo(e.daysAgo);
      let emLog = await emailLogRepo.findOne({
        where: { recipient: user.email, eventType: e.eventType },
      });
      if (!emLog) {
        emLog = emailLogRepo.create({
          recipient: user.email,
          userId: user.id,
          eventType: e.eventType,
          subject: e.subject,
          status: EmailStatus.SENT,
          sentAt: emDate,
        });
        emLog = await emailLogRepo.save(emLog);
      }
      await setTimestamps(dataSource, 'email_logs', emLog.id, emDate);
    }
  }

  // 17. Seed Admin Audit Logs across past 60 days
  console.log('📝 Seeding Admin Audit Logs across different dates...');
  const adminUser =
    seededUsers.find((u) => u.role?.name === 'SUPER_ADMIN') || seededUsers[0];
  const auditActions = [
    {
      action: 'UPDATE_SYSTEM_SETTINGS',
      targetType: 'SETTING',
      targetName: 'MAX_STREAM_BITRATE_KBPS',
      daysAgo: 50,
    },
    {
      action: 'TOGGLE_FEATURE_FLAG',
      targetType: 'FEATURE_FLAG',
      targetName: 'AI_CAPTIONS',
      daysAgo: 35,
    },
    {
      action: 'REVIEW_PAYMENT_GATEWAY',
      targetType: 'PAYMENT',
      targetName: 'STRIPE_WEBHOOK',
      daysAgo: 15,
    },
    {
      action: 'EXPORT_MONTHLY_REPORT',
      targetType: 'REPORT',
      targetName: 'REVENUE_OCT_2026',
      daysAgo: 3,
    },
  ];
  for (const a of auditActions) {
    const aDate = daysAgo(a.daysAgo);
    let aLog = await adminAuditLogRepo.findOne({
      where: { adminUserId: adminUser.id, action: a.action },
    });
    if (!aLog) {
      aLog = adminAuditLogRepo.create({
        adminUserId: adminUser.id,
        action: a.action,
        module: 'SYSTEM',
        targetType: a.targetType,
        targetName: a.targetName,
        ipAddress: faker.internet.ipv4(),
      });
      aLog = await adminAuditLogRepo.save(aLog);
    }
    await setTimestamps(dataSource, 'admin_audit_logs', aLog.id, aDate);
  }

  const oldestDate = daysAgo(daysSpan).toISOString().split('T')[0];
  const todayDate = new Date().toISOString().split('T')[0];

  return {
    users: await userRepo.count(),
    userSessions: await userSessionRepo.count(),
    workspaces: await workspaceRepo.count(),
    workspaceMembers: await memberRepo.count(),
    subscriptions: await subscriptionRepo.count(),
    payments: await paymentRepo.count(),
    connectedAccounts: await connectedAccountRepo.count(),
    oauthTokens: await oauthTokenRepo.count(),
    socialAccounts: await socialAccountRepo.count(),
    streams: await liveStreamRepo.count(),
    streamPlatforms: await streamPlatformRepo.count(),
    analyticsSnapshots: await analyticsSnapshotRepo.count(),
    notifications: await notificationRepo.count(),
    activityLogs: await activityLogRepo.count(),
    invitations: await invitationRepo.count(),
    featureFlags: await featureFlagRepo.count(),
    systemSettings: await systemSettingRepo.count(),
    securityEvents: await securityEventRepo.count(),
    emailLogs: await emailLogRepo.count(),
    adminAuditLogs: await adminAuditLogRepo.count(),
    dateRange: `${oldestDate} to ${todayDate} (${daysSpan} days)`,
  };
}
