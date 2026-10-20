import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';

async function bootstrap() {
  console.log('Attempting to create Nest application context...');
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    console.log('Application context created successfully. DI graph is valid!');
    await app.close();
  } catch (error) {
    console.error('Failed to create application context. DI Error:');
    console.error(error);
    process.exit(1);
  }
}

bootstrap();
