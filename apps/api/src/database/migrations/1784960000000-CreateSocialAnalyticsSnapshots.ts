import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSocialAnalyticsSnapshots1784960000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`social_analytics_snapshots\` (
        \`id\` varchar(36) NOT NULL,
        \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` timestamp(6) NULL,
        \`workspace_id\` varchar(255) NOT NULL,
        \`connected_account_id\` varchar(255) NULL,
        \`platform_name\` varchar(50) NOT NULL,
        \`followers\` int NOT NULL DEFAULT 0,
        \`engagement\` int NOT NULL DEFAULT 0,
        \`snapshot_date\` date NOT NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_snapshot_ws_date\` (\`workspace_id\`, \`snapshot_date\`),
        INDEX \`IDX_snapshot_account\` (\`connected_account_id\`),
        INDEX \`IDX_snapshot_date\` (\`snapshot_date\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS \`social_analytics_snapshots\``,
    );
  }
}
