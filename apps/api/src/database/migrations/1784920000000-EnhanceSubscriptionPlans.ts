import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceSubscriptionPlans1784920000000 implements MigrationInterface {
  name = 'EnhanceSubscriptionPlans1784920000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check and add columns safely if they do not exist
    const table = await queryRunner.getTable('subscription_plans');
    
    if (table) {
      if (!table.findColumnByName('code')) {
        await queryRunner.query(
          `ALTER TABLE \`subscription_plans\` ADD COLUMN \`code\` varchar(100) NULL`,
        );
      }

      if (!table.findColumnByName('currency')) {
        await queryRunner.query(
          `ALTER TABLE \`subscription_plans\` ADD COLUMN \`currency\` varchar(10) NOT NULL DEFAULT 'INR'`,
        );
      }

      if (!table.findColumnByName('billing_type')) {
        await queryRunner.query(
          `ALTER TABLE \`subscription_plans\` ADD COLUMN \`billing_type\` varchar(50) NOT NULL DEFAULT 'recurring'`,
        );
      }

      if (!table.findColumnByName('duration_days')) {
        await queryRunner.query(
          `ALTER TABLE \`subscription_plans\` ADD COLUMN \`duration_days\` int NULL`,
        );
      }

      if (!table.findColumnByName('is_popular')) {
        await queryRunner.query(
          `ALTER TABLE \`subscription_plans\` ADD COLUMN \`is_popular\` tinyint NOT NULL DEFAULT 0`,
        );
      }

      if (!table.findColumnByName('display_order')) {
        await queryRunner.query(
          `ALTER TABLE \`subscription_plans\` ADD COLUMN \`display_order\` int NOT NULL DEFAULT 0`,
        );
      }

      // Populate codes and orders for default existing plans
      await queryRunner.query(
        `UPDATE \`subscription_plans\` SET \`code\` = 'free', \`display_order\` = 1, \`is_popular\` = 0 WHERE \`name\` = 'Free' AND (\`code\` IS NULL OR \`code\` = '')`,
      );
      await queryRunner.query(
        `UPDATE \`subscription_plans\` SET \`code\` = 'starter', \`display_order\` = 2, \`is_popular\` = 0 WHERE \`name\` = 'Starter' AND (\`code\` IS NULL OR \`code\` = '')`,
      );
      await queryRunner.query(
        `UPDATE \`subscription_plans\` SET \`code\` = 'professional', \`display_order\` = 3, \`is_popular\` = 1 WHERE \`name\` = 'Professional' AND (\`code\` IS NULL OR \`code\` = '')`,
      );
      await queryRunner.query(
        `UPDATE \`subscription_plans\` SET \`code\` = 'enterprise', \`display_order\` = 4, \`is_popular\` = 0 WHERE \`name\` = 'Enterprise' AND (\`code\` IS NULL OR \`code\` = '')`,
      );

      // Backfill any remaining null codes using sanitized name
      await queryRunner.query(
        `UPDATE \`subscription_plans\` SET \`code\` = LOWER(REPLACE(REPLACE(\`name\`, ' ', '-'), '_', '-')) WHERE \`code\` IS NULL OR \`code\` = ''`,
      );

      // Add unique index on code
      const hasCodeIndex = table.indices.some((idx) => idx.columnNames.includes('code'));
      if (!hasCodeIndex) {
        await queryRunner.query(
          `CREATE UNIQUE INDEX \`IDX_subscription_plans_code\` ON \`subscription_plans\` (\`code\`)`,
        );
      }
    }

    // Ensure ADMIN role has platform.plans.manage permission
    try {
      const [adminRole] = await queryRunner.query(
        `SELECT id FROM \`roles\` WHERE \`name\` = 'ADMIN' LIMIT 1`,
      );
      const [managePerm] = await queryRunner.query(
        `SELECT id FROM \`permissions\` WHERE \`key\` = 'platform.plans.manage' LIMIT 1`,
      );
      if (adminRole && managePerm) {
        const [existing] = await queryRunner.query(
          `SELECT * FROM \`role_permissions\` WHERE \`role_id\` = ? AND \`permission_id\` = ?`,
          [adminRole.id, managePerm.id],
        );
        if (!existing) {
          await queryRunner.query(
            `INSERT INTO \`role_permissions\` (\`role_id\`, \`permission_id\`) VALUES (?, ?)`,
            [adminRole.id, managePerm.id],
          );
        }
      }
    } catch {
      // Role permissions table might be named differently or already seeded
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('subscription_plans');
    if (table) {
      if (table.indices.some((idx) => idx.name === 'IDX_subscription_plans_code')) {
        await queryRunner.query(
          `DROP INDEX \`IDX_subscription_plans_code\` ON \`subscription_plans\``,
        );
      }
      if (table.findColumnByName('display_order')) {
        await queryRunner.query(
          `ALTER TABLE \`subscription_plans\` DROP COLUMN \`display_order\``,
        );
      }
      if (table.findColumnByName('is_popular')) {
        await queryRunner.query(
          `ALTER TABLE \`subscription_plans\` DROP COLUMN \`is_popular\``,
        );
      }
      if (table.findColumnByName('duration_days')) {
        await queryRunner.query(
          `ALTER TABLE \`subscription_plans\` DROP COLUMN \`duration_days\``,
        );
      }
      if (table.findColumnByName('billing_type')) {
        await queryRunner.query(
          `ALTER TABLE \`subscription_plans\` DROP COLUMN \`billing_type\``,
        );
      }
      if (table.findColumnByName('currency')) {
        await queryRunner.query(
          `ALTER TABLE \`subscription_plans\` DROP COLUMN \`currency\``,
        );
      }
      if (table.findColumnByName('code')) {
        await queryRunner.query(
          `ALTER TABLE \`subscription_plans\` DROP COLUMN \`code\``,
        );
      }
    }
  }
}
