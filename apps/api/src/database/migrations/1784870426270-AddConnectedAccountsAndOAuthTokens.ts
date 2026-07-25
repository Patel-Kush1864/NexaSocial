import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConnectedAccountsAndOAuthTokens1784870426270 implements MigrationInterface {
  name = 'AddConnectedAccountsAndOAuthTokens1784870426270';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`oauth_tokens\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`connected_account_id\` varchar(255) NOT NULL, \`access_token\` text NOT NULL, \`refresh_token\` text NULL, \`expires_at\` timestamp NULL, \`scope\` text NULL, \`token_type\` varchar(255) NULL, UNIQUE INDEX \`REL_117dca59e4a2059987eb9135f5\` (\`connected_account_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`connected_accounts\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`workspace_id\` varchar(255) NOT NULL, \`platform_name\` varchar(255) NOT NULL, \`platform_user_id\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`avatar\` varchar(255) NULL, \`status\` varchar(50) NOT NULL DEFAULT 'CONNECTED', \`metadata\` json NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`oauth_tokens\` ADD CONSTRAINT \`FK_117dca59e4a2059987eb9135f5e\` FOREIGN KEY (\`connected_account_id\`) REFERENCES \`connected_accounts\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`connected_accounts\` ADD CONSTRAINT \`FK_fa1d49f432cd16f027ccc6f7e6f\` FOREIGN KEY (\`workspace_id\`) REFERENCES \`workspaces\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`connected_accounts\` DROP FOREIGN KEY \`FK_fa1d49f432cd16f027ccc6f7e6f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`oauth_tokens\` DROP FOREIGN KEY \`FK_117dca59e4a2059987eb9135f5e\``,
    );
    await queryRunner.query(`DROP TABLE \`connected_accounts\``);
    await queryRunner.query(
      `DROP INDEX \`REL_117dca59e4a2059987eb9135f5\` ON \`oauth_tokens\``,
    );
    await queryRunner.query(`DROP TABLE \`oauth_tokens\``);
  }
}
