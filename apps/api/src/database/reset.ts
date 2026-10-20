/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import dataSource from './data-source';

async function resetDatabase() {
  console.log('Connecting to database...');
  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    console.log('Database connected.');

    // Disable foreign key checks
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0;');

    // Get all tables
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = (SELECT DATABASE());
    `);

    console.log(`Found ${tables.length} tables to truncate.`);

    // Truncate all tables
    for (const table of tables) {
      const tableName = table.TABLE_NAME || table.table_name;
      // Keep migrations table so typeorm doesn't think we need to rerun them
      if (tableName === 'migrations') {
        console.log(`Skipping ${tableName}...`);
        continue;
      }
      console.log(`Truncating ${tableName}...`);
      await dataSource.query(`TRUNCATE TABLE \`${tableName}\`;`);
    }

    // Enable foreign key checks
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('Database successfully truncated.');
  } catch (error) {
    console.error('Failed to reset database:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

resetDatabase();
