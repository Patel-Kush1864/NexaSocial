import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddViewerUrlToStreamPlatforms1784900000000 implements MigrationInterface {
  name = 'AddViewerUrlToStreamPlatforms1784900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`stream_platforms\` ADD \`viewer_url\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`stream_platforms\` DROP COLUMN \`viewer_url\``,
    );
  }
}
