import dataSource from '../data-source';
import { runSeed } from './seed';

async function bootstrap() {
  console.log('Initializing database connection for seeding...');
  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    await runSeed(dataSource);
    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

void bootstrap();
