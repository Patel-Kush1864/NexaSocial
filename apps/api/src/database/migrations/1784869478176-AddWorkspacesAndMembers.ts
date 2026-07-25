import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkspacesAndMembers1784869478176 implements MigrationInterface {
  name = 'AddWorkspacesAndMembers1784869478176';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`workspaces\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`owner_id\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`slug\` varchar(255) NOT NULL, \`logo\` varchar(255) NULL, \`description\` text NULL, \`status\` varchar(255) NOT NULL DEFAULT 'ACTIVE', \`timezone\` varchar(255) NOT NULL DEFAULT 'UTC', \`settings\` json NULL, UNIQUE INDEX \`IDX_b8e9fe62e93d60089dfc4f175f\` (\`slug\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`workspace_members\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`workspace_id\` varchar(255) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`role\` varchar(50) NOT NULL DEFAULT 'VIEWER', \`joined_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`invited_by\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`workspace_invitations\` (\`id\` varchar(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`workspace_id\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`role\` varchar(50) NOT NULL DEFAULT 'VIEWER', \`token\` varchar(255) NOT NULL, \`status\` varchar(50) NOT NULL DEFAULT 'PENDING', \`expires_at\` timestamp NOT NULL, \`invited_by_id\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_efb7ba588916737f408a72a3cc\` (\`token\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`workspaces\` ADD CONSTRAINT \`FK_3bc45ecdd8fdc2108bb92516dde\` FOREIGN KEY (\`owner_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`workspace_members\` ADD CONSTRAINT \`FK_4a7c584ddfe855379598b5e20fd\` FOREIGN KEY (\`workspace_id\`) REFERENCES \`workspaces\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`workspace_members\` ADD CONSTRAINT \`FK_4e83431119fa585fc7aa8b817db\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`workspace_invitations\` ADD CONSTRAINT \`FK_cf5df369b7a86ea3cdf18c7b56d\` FOREIGN KEY (\`workspace_id\`) REFERENCES \`workspaces\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`workspace_invitations\` ADD CONSTRAINT \`FK_df43d23188e48d0920ce4c2895d\` FOREIGN KEY (\`invited_by_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`workspace_invitations\` DROP FOREIGN KEY \`FK_df43d23188e48d0920ce4c2895d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`workspace_invitations\` DROP FOREIGN KEY \`FK_cf5df369b7a86ea3cdf18c7b56d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`workspace_members\` DROP FOREIGN KEY \`FK_4e83431119fa585fc7aa8b817db\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`workspace_members\` DROP FOREIGN KEY \`FK_4a7c584ddfe855379598b5e20fd\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`workspaces\` DROP FOREIGN KEY \`FK_3bc45ecdd8fdc2108bb92516dde\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_efb7ba588916737f408a72a3cc\` ON \`workspace_invitations\``,
    );
    await queryRunner.query(`DROP TABLE \`workspace_invitations\``);
    await queryRunner.query(`DROP TABLE \`workspace_members\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_b8e9fe62e93d60089dfc4f175f\` ON \`workspaces\``,
    );
    await queryRunner.query(`DROP TABLE \`workspaces\``);
  }
}
