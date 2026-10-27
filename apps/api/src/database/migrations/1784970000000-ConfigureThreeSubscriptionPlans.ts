import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConfigureThreeSubscriptionPlans1784970000000 implements MigrationInterface {
  name = 'ConfigureThreeSubscriptionPlans1784970000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const starterFeatures = JSON.stringify({
      workspaces: 2,
      socialAccounts: 5,
      teamMembers: 3,
      liveStreaming: true,
      maxStreams: 20,
      analytics: true,
      aiFeatures: false,
      prioritySupport: false,
      storageGb: 5,
      apiAccess: false,
      customBranding: false,
      streamScheduling: true,
      multiPlatformStreaming: false,
    });

    const proFeatures = JSON.stringify({
      workspaces: 10,
      socialAccounts: 20,
      teamMembers: 10,
      liveStreaming: true,
      maxStreams: 100,
      analytics: true,
      aiFeatures: true,
      prioritySupport: true,
      storageGb: 20,
      apiAccess: true,
      customBranding: true,
      streamScheduling: true,
      multiPlatformStreaming: true,
    });

    const enterpriseFeatures = JSON.stringify({
      workspaces: -1,
      socialAccounts: -1,
      teamMembers: -1,
      liveStreaming: true,
      maxStreams: -1,
      analytics: true,
      aiFeatures: true,
      prioritySupport: true,
      storageGb: -1,
      apiAccess: true,
      customBranding: true,
      streamScheduling: true,
      multiPlatformStreaming: true,
    });

    // 1. Update Starter Plan
    const [starterPlan] = await queryRunner.query(
      `SELECT id FROM \`subscription_plans\` WHERE \`name\` IN ('Starter', 'Starter Plan') OR \`code\` = 'starter' LIMIT 1`,
    );

    if (starterPlan) {
      await queryRunner.query(
        `UPDATE \`subscription_plans\`
         SET \`name\` = 'Starter Plan',
             \`code\` = 'starter',
             \`description\` = 'Starter plan for small teams, solo creators, and growing channels',
             \`price\` = 499.00,
             \`currency\` = 'INR',
             \`interval\` = 'month',
             \`billing_type\` = 'recurring',
             \`is_popular\` = 0,
             \`display_order\` = 1,
             \`is_active\` = 1,
             \`deleted_at\` = NULL,
             \`features\` = ?
         WHERE \`id\` = ?`,
        [starterFeatures, starterPlan.id],
      );
    } else {
      await queryRunner.query(
        `INSERT INTO \`subscription_plans\`
         (\`id\`, \`name\`, \`code\`, \`description\`, \`price\`, \`currency\`, \`interval\`, \`billing_type\`, \`is_popular\`, \`display_order\`, \`is_active\`, \`deleted_at\`, \`features\`)
         VALUES (UUID(), 'Starter Plan', 'starter', 'Starter plan for small teams, solo creators, and growing channels', 499.00, 'INR', 'month', 'recurring', 0, 1, 1, NULL, ?)`,
        [starterFeatures],
      );
    }

    // 2. Update Pro Plan (formerly Professional)
    const [proPlan] = await queryRunner.query(
      `SELECT id FROM \`subscription_plans\` WHERE \`name\` IN ('Professional', 'Pro', 'Pro Plan') OR \`code\` IN ('pro', 'professional') LIMIT 1`,
    );

    if (proPlan) {
      await queryRunner.query(
        `UPDATE \`subscription_plans\`
         SET \`name\` = 'Pro Plan',
             \`code\` = 'pro',
             \`description\` = 'Pro plan for growing businesses, power users, and multi-platform creators',
             \`price\` = 999.00,
             \`currency\` = 'INR',
             \`interval\` = 'month',
             \`billing_type\` = 'recurring',
             \`is_popular\` = 1,
             \`display_order\` = 2,
             \`is_active\` = 1,
             \`deleted_at\` = NULL,
             \`features\` = ?
         WHERE \`id\` = ?`,
        [proFeatures, proPlan.id],
      );
    } else {
      await queryRunner.query(
        `INSERT INTO \`subscription_plans\`
         (\`id\`, \`name\`, \`code\`, \`description\`, \`price\`, \`currency\`, \`interval\`, \`billing_type\`, \`is_popular\`, \`display_order\`, \`is_active\`, \`deleted_at\`, \`features\`)
         VALUES (UUID(), 'Pro Plan', 'pro', 'Pro plan for growing businesses, power users, and multi-platform creators', 999.00, 'INR', 'month', 'recurring', 1, 2, 1, NULL, ?)`,
        [proFeatures],
      );
    }

    // 3. Update Enterprise Plan
    const [enterprisePlan] = await queryRunner.query(
      `SELECT id FROM \`subscription_plans\` WHERE \`name\` IN ('Enterprise', 'Enterprise Plan') OR \`code\` = 'enterprise' LIMIT 1`,
    );

    if (enterprisePlan) {
      await queryRunner.query(
        `UPDATE \`subscription_plans\`
         SET \`name\` = 'Enterprise Plan',
             \`code\` = 'enterprise',
             \`description\` = 'Enterprise plan with unlimited limits, dedicated infrastructure, and premium SLA support',
             \`price\` = 2999.00,
             \`currency\` = 'INR',
             \`interval\` = 'month',
             \`billing_type\` = 'recurring',
             \`is_popular\` = 0,
             \`display_order\` = 3,
             \`is_active\` = 1,
             \`deleted_at\` = NULL,
             \`features\` = ?
         WHERE \`id\` = ?`,
        [enterpriseFeatures, enterprisePlan.id],
      );
    } else {
      await queryRunner.query(
        `INSERT INTO \`subscription_plans\`
         (\`id\`, \`name\`, \`code\`, \`description\`, \`price\`, \`currency\`, \`interval\`, \`billing_type\`, \`is_popular\`, \`display_order\`, \`is_active\`, \`deleted_at\`, \`features\`)
         VALUES (UUID(), 'Enterprise Plan', 'enterprise', 'Enterprise plan with unlimited limits, dedicated infrastructure, and premium SLA support', 2999.00, 'INR', 'month', 'recurring', 0, 3, 1, NULL, ?)`,
        [enterpriseFeatures],
      );
    }

    // 4. Deactivate all other plans (e.g. Free or legacy plans) so that ONLY the 3 plans show
    await queryRunner.query(
      `UPDATE \`subscription_plans\`
       SET \`is_active\` = 0
       WHERE \`name\` NOT IN ('Starter Plan', 'Pro Plan', 'Enterprise Plan')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE \`subscription_plans\`
       SET \`name\` = 'Starter', \`code\` = 'starter', \`display_order\` = 2
       WHERE \`name\` = 'Starter Plan'`,
    );

    await queryRunner.query(
      `UPDATE \`subscription_plans\`
       SET \`name\` = 'Professional', \`code\` = 'professional', \`display_order\` = 3
       WHERE \`name\` = 'Pro Plan'`,
    );

    await queryRunner.query(
      `UPDATE \`subscription_plans\`
       SET \`name\` = 'Enterprise', \`code\` = 'enterprise', \`display_order\` = 4, \`is_active\` = 0
       WHERE \`name\` = 'Enterprise Plan'`,
    );

    await queryRunner.query(
      `UPDATE \`subscription_plans\`
       SET \`is_active\` = 1
       WHERE \`name\` = 'Free'`,
    );
  }
}
