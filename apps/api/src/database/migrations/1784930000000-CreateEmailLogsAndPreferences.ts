/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmailLogsAndPreferences1784930000000 implements MigrationInterface {
  name = 'CreateEmailLogsAndPreferences1784930000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create email_logs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`email_logs\` (
        \`id\` varchar(36) NOT NULL,
        \`recipient\` varchar(255) NOT NULL,
        \`user_id\` varchar(36) NULL,
        \`event_type\` varchar(100) NOT NULL,
        \`subject\` varchar(255) NOT NULL,
        \`status\` varchar(50) NOT NULL DEFAULT 'PENDING',
        \`idempotency_key\` varchar(255) NULL,
        \`metadata\` json NULL,
        \`error_message\` text NULL,
        \`retry_count\` int NOT NULL DEFAULT 0,
        \`sent_at\` datetime NULL,
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`IDX_email_logs_idempotency_key\` (\`idempotency_key\`),
        KEY \`IDX_email_logs_recipient\` (\`recipient\`),
        KEY \`IDX_email_logs_event_type\` (\`event_type\`),
        KEY \`IDX_email_logs_status\` (\`status\`),
        KEY \`IDX_email_logs_user_id\` (\`user_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Create user_email_preferences table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`user_email_preferences\` (
        \`id\` varchar(36) NOT NULL,
        \`user_id\` varchar(36) NOT NULL,
        \`streaming_emails\` tinyint(1) NOT NULL DEFAULT 1,
        \`social_emails\` tinyint(1) NOT NULL DEFAULT 1,
        \`workspace_emails\` tinyint(1) NOT NULL DEFAULT 1,
        \`marketing_emails\` tinyint(1) NOT NULL DEFAULT 0,
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`IDX_email_prefs_user_id\` (\`user_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Register platform.email.manage permission if permissions table exists
    try {
      const [permExists] = await queryRunner.query(
        `SELECT id FROM \`permissions\` WHERE \`key\` = 'platform.email.manage' LIMIT 1`,
      );
      let permId = permExists?.id;

      if (!permId) {
        const crypto = require('crypto');
        permId = crypto.randomUUID();
        await queryRunner.query(
          `INSERT INTO \`permissions\` (\`id\`, \`key\`, \`name\`, \`description\`, \`module\`) VALUES (?, 'platform.email.manage', 'Manage Email Notifications', 'Configure SMTP settings, view email delivery logs and retry messages', 'PLATFORM')`,
          [permId],
        );
      }

      // Grant to ADMIN and SUPER_ADMIN roles
      const roles = await queryRunner.query(
        `SELECT id FROM \`roles\` WHERE \`name\` IN ('ADMIN', 'SUPER_ADMIN')`,
      );

      for (const role of roles) {
        const [hasRolePerm] = await queryRunner.query(
          `SELECT * FROM \`role_permissions\` WHERE \`role_id\` = ? AND \`permission_id\` = ?`,
          [role.id, permId],
        );
        if (!hasRolePerm) {
          await queryRunner.query(
            `INSERT INTO \`role_permissions\` (\`role_id\`, \`permission_id\`) VALUES (?, ?)`,
            [role.id, permId],
          );
        }
      }
    } catch {
      // Ignore if permissions or roles tables are not structured this way
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`user_email_preferences\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`email_logs\``);
  }
}
