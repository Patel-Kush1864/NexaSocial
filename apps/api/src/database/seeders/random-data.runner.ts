import dataSource from '../data-source';
import { seedRandomData } from './random-data.seeder';

async function bootstrap() {
  const args = process.argv.slice(2);
  const isFresh = args.includes('--fresh') || args.includes('-f');
  const daysArg = args.find((a) => a.startsWith('--days='));
  const daysSpan = daysArg ? parseInt(daysArg.split('=')[1], 10) : 90;

  console.log('\n======================================================');
  console.log('🎲 NexaSocial Multi-Date Random Data Generator');
  console.log(`📅 Timeline: Past ${daysSpan} days to Today (Multi-Date Mode)`);
  if (isFresh) {
    console.log('🧹 Mode: Fresh Reset & Re-Seed');
  }
  console.log('======================================================\n');

  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    const summary = await seedRandomData(dataSource, {
      fresh: isFresh,
      daysSpan,
    });

    console.log('\n======================================================');
    console.log('📊 Seeding Summary Across All Tables with Different Dates');
    console.log(`⏱️ Date Range: ${summary.dateRange}`);
    console.log('======================================================');
    console.table([
      {
        Table: 'users',
        'Total Records': summary.users,
        'Date Coverage': 'Past 90 days (Staggered)',
      },
      {
        Table: 'user_sessions',
        'Total Records': summary.userSessions,
        'Date Coverage': 'Past 14 days',
      },
      {
        Table: 'workspaces',
        'Total Records': summary.workspaces,
        'Date Coverage': 'Past 88 days',
      },
      {
        Table: 'workspace_members',
        'Total Records': summary.workspaceMembers,
        'Date Coverage': 'Staggered join dates',
      },
      {
        Table: 'user_subscriptions',
        'Total Records': summary.subscriptions,
        'Date Coverage': 'Active & Renewals',
      },
      {
        Table: 'payments',
        'Total Records': summary.payments,
        'Date Coverage': 'Multi-month recurring history',
      },
      {
        Table: 'connected_accounts',
        'Total Records': summary.connectedAccounts,
        'Date Coverage': 'Staggered connection dates',
      },
      {
        Table: 'oauth_tokens',
        'Total Records': summary.oauthTokens,
        'Date Coverage': 'Valid OAuth credentials',
      },
      {
        Table: 'social_accounts',
        'Total Records': summary.socialAccounts,
        'Date Coverage': 'User social logins',
      },
      {
        Table: 'live_streams',
        'Total Records': summary.streams,
        'Date Coverage': '2 LIVE, 19 ENDED, 3 SCHEDULED',
      },
      {
        Table: 'stream_platforms',
        'Total Records': summary.streamPlatforms,
        'Date Coverage': 'Multi-destination per stream',
      },
      {
        Table: 'social_analytics_snapshots',
        'Total Records': summary.analyticsSnapshots,
        'Date Coverage': '60 consecutive daily snapshots',
      },
      {
        Table: 'notifications',
        'Total Records': summary.notifications,
        'Date Coverage': 'Past 30 days',
      },
      {
        Table: 'activity_logs',
        'Total Records': summary.activityLogs,
        'Date Coverage': 'Past 60 days',
      },
      {
        Table: 'workspace_invitations',
        'Total Records': summary.invitations,
        'Date Coverage': 'Past 30 days',
      },
      {
        Table: 'feature_flags',
        'Total Records': summary.featureFlags,
        'Date Coverage': 'System configurations',
      },
      {
        Table: 'system_settings',
        'Total Records': summary.systemSettings,
        'Date Coverage': 'System settings',
      },
      {
        Table: 'security_events',
        'Total Records': summary.securityEvents,
        'Date Coverage': 'Past 45 days',
      },
      {
        Table: 'email_logs',
        'Total Records': summary.emailLogs,
        'Date Coverage': 'Past 60 days',
      },
      {
        Table: 'admin_audit_logs',
        'Total Records': summary.adminAuditLogs,
        'Date Coverage': 'Past 60 days',
      },
    ]);

    console.log(
      '\n✨ Database successfully populated with realistic multi-date random data!',
    );
    console.log('🔑 Demo User Login:');
    console.log('   Email:    demo@nexasocial.com');
    console.log('   Password: Password123!');
    console.log('======================================================\n');
  } catch (error) {
    console.error('❌ Multi-date random data seeding failed:', error);
    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

void bootstrap();
