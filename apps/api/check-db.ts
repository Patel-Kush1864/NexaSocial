import dataSource from './src/database/data-source';

async function checkDb() {
  try {
    console.log('Initializing database connection...');
    await dataSource.initialize();
    console.log('Database connection initialized successfully!');
    
    const entities = dataSource.entityMetadatas;
    console.log(`Found ${entities.length} entities.`);
    
    const tableNames = entities.map(e => e.tableName);
    console.log('Tables:', tableNames.join(', '));
    
    await dataSource.destroy();
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  }
}

checkDb();
