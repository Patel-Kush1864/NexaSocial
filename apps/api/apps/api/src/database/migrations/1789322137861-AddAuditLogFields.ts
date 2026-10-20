import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditLogFields1789322137861 implements MigrationInterface {
  name = 'AddAuditLogFields1789322137861';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`admin_audit_logs\` ADD \`target_type\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`admin_audit_logs\` ADD \`target_name\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`admin_audit_logs\` ADD \`user_agent\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`admin_audit_logs\` ADD \`request_id\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_c482b86eb5ce32e6bdf2574695\` ON \`admin_audit_logs\` (\`target_type\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_c482b86eb5ce32e6bdf2574695\` ON \`admin_audit_logs\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`admin_audit_logs\` DROP COLUMN \`request_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`admin_audit_logs\` DROP COLUMN \`user_agent\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`admin_audit_logs\` DROP COLUMN \`target_name\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`admin_audit_logs\` DROP COLUMN \`target_type\``,
    );
  }
}
