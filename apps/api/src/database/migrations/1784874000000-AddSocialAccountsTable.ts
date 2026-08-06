import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSocialAccountsTable1784874000000 implements MigrationInterface {
  name = 'AddSocialAccountsTable1784874000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS \`social_accounts\` (
        \`id\` varchar(36) NOT NULL,
        \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` timestamp(6) NULL,
        \`user_id\` varchar(255) NOT NULL,
        \`provider\` varchar(50) NOT NULL,
        \`provider_user_id\` varchar(255) NOT NULL,
        \`provider_user_name\` varchar(255) NOT NULL,
        \`provider_email\` varchar(255) NULL,
        \`user_access_token\` text NULL,
        \`user_refresh_token\` text NULL,
        \`token_expires_at\` datetime NULL,
        \`page_id\` varchar(255) NULL,
        \`page_name\` varchar(255) NULL,
        \`page_access_token\` text NULL,
        \`status\` varchar(50) NOT NULL DEFAULT 'CONNECTED',
        \`connected_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`social_accounts\``);
  }
}
