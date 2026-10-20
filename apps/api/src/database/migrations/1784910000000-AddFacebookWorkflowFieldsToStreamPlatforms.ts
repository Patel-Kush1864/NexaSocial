import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFacebookWorkflowFieldsToStreamPlatforms1784910000000
  implements MigrationInterface
{
  name = 'AddFacebookWorkflowFieldsToStreamPlatforms1784910000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`stream_platforms\`
        ADD \`facebook_live_video_id\` varchar(255) NULL,
        ADD \`facebook_page_id\` varchar(255) NULL,
        ADD \`source_connected_at\` timestamp NULL,
        ADD \`metadata_completed_at\` timestamp NULL,
        ADD \`published_at\` timestamp NULL,
        ADD \`source_status\` varchar(50) NOT NULL DEFAULT 'DISCONNECTED',
        ADD \`metadata_status\` varchar(50) NOT NULL DEFAULT 'PENDING',
        ADD \`publish_status\` varchar(50) NOT NULL DEFAULT 'IDLE',
        ADD \`facebook_last_error\` text NULL,
        ADD \`facebook_last_error_code\` varchar(50) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`stream_platforms\`
        DROP COLUMN \`facebook_last_error_code\`,
        DROP COLUMN \`facebook_last_error\`,
        DROP COLUMN \`publish_status\`,
        DROP COLUMN \`metadata_status\`,
        DROP COLUMN \`source_status\`,
        DROP COLUMN \`published_at\`,
        DROP COLUMN \`metadata_completed_at\`,
        DROP COLUMN \`source_connected_at\`,
        DROP COLUMN \`facebook_page_id\`,
        DROP COLUMN \`facebook_live_video_id\``,
    );
  }
}
