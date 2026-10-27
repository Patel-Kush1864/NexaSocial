import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeStreamKeyAndUrlToTextInStreamPlatforms1784950000000
  implements MigrationInterface
{
  name = 'ChangeStreamKeyAndUrlToTextInStreamPlatforms1784950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`stream_platforms\` MODIFY \`stream_key\` TEXT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`stream_platforms\` MODIFY \`stream_url\` TEXT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`stream_platforms\` MODIFY \`stream_key\` VARCHAR(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`stream_platforms\` MODIFY \`stream_url\` VARCHAR(255) NULL`,
    );
  }
}
