import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInstagramWorkflowFieldsToStreamPlatforms1784940000000
  implements MigrationInterface
{
  name = 'AddInstagramWorkflowFieldsToStreamPlatforms1784940000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('stream_platforms');
    if (!table) return;

    if (!table.findColumnByName('instagram_last_error')) {
      await queryRunner.query(
        `ALTER TABLE \`stream_platforms\` ADD \`instagram_last_error\` text NULL`,
      );
    }

    if (!table.findColumnByName('instagram_last_error_code')) {
      await queryRunner.query(
        `ALTER TABLE \`stream_platforms\` ADD \`instagram_last_error_code\` varchar(50) NULL`,
      );
    }

    if (!table.findColumnByName('ingest_mode')) {
      await queryRunner.query(
        `ALTER TABLE \`stream_platforms\` ADD \`ingest_mode\` varchar(50) NOT NULL DEFAULT 'LIVE_PRODUCER'`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('stream_platforms');
    if (!table) return;

    if (table.findColumnByName('ingest_mode')) {
      await queryRunner.query(
        `ALTER TABLE \`stream_platforms\` DROP COLUMN \`ingest_mode\``,
      );
    }

    if (table.findColumnByName('instagram_last_error_code')) {
      await queryRunner.query(
        `ALTER TABLE \`stream_platforms\` DROP COLUMN \`instagram_last_error_code\``,
      );
    }

    if (table.findColumnByName('instagram_last_error')) {
      await queryRunner.query(
        `ALTER TABLE \`stream_platforms\` DROP COLUMN \`instagram_last_error\``,
      );
    }
  }
}
