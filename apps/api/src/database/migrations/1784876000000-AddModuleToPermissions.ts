import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddModuleToPermissions1784876000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'permissions',
      new TableColumn({
        name: 'module',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('permissions', 'module');
  }
}
