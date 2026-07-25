import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLiveStreamsAndStreamPlatforms1784872302071 implements MigrationInterface {
  name = 'AddLiveStreamsAndStreamPlatforms1784872302071';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`stream_platforms\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`stream_id\` varchar(255) NOT NULL, \`connected_account_id\` varchar(255) NOT NULL, \`stream_key\` varchar(255) NULL, \`stream_url\` varchar(255) NULL, \`platform_stream_id\` varchar(255) NULL, \`status\` varchar(50) NOT NULL DEFAULT 'PENDING', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`live_streams\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`workspace_id\` varchar(255) NOT NULL, \`title\` varchar(255) NOT NULL, \`description\` text NULL, \`thumbnail\` varchar(255) NULL, \`visibility\` varchar(50) NOT NULL DEFAULT 'PUBLIC', \`scheduled_at\` timestamp NULL, \`started_at\` timestamp NULL, \`ended_at\` timestamp NULL, \`status\` varchar(50) NOT NULL DEFAULT 'DRAFT', \`created_by\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`stream_platforms\` ADD CONSTRAINT \`FK_7924cb241a83f6c8094804248fd\` FOREIGN KEY (\`stream_id\`) REFERENCES \`live_streams\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`stream_platforms\` ADD CONSTRAINT \`FK_16db9f17bb922b578aa20ca1dfe\` FOREIGN KEY (\`connected_account_id\`) REFERENCES \`connected_accounts\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`live_streams\` ADD CONSTRAINT \`FK_e37a1c63bf847fb72fc93e6820c\` FOREIGN KEY (\`workspace_id\`) REFERENCES \`workspaces\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`live_streams\` DROP FOREIGN KEY \`FK_e37a1c63bf847fb72fc93e6820c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`stream_platforms\` DROP FOREIGN KEY \`FK_16db9f17bb922b578aa20ca1dfe\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`stream_platforms\` DROP FOREIGN KEY \`FK_7924cb241a83f6c8094804248fd\``,
    );
    await queryRunner.query(`DROP TABLE \`live_streams\``);
    await queryRunner.query(`DROP TABLE \`stream_platforms\``);
  }
}
