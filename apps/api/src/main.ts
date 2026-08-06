import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerServiceWrapper } from './logger/logger.service';
import {
  HttpExceptionFilter,
  DatabaseFilter,
  AuthFilter,
  ValidationFilter,
} from './common/filters';
import { ValidationPipe } from './common/validation/validation.pipe';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      bufferLogs: true,
    });

    const logger = app.get(LoggerServiceWrapper);
    app.useLogger(logger);

    // Enable CORS
    app.enableCors({
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'X-Requested-With',
      ],
    });

    // Set global API prefix
    app.setGlobalPrefix('api');

    // Global Validation Pipe
    app.useGlobalPipes(new ValidationPipe());

    // Global Exception Filters
    app.useGlobalFilters(
      new HttpExceptionFilter(logger),
      new DatabaseFilter(logger),
      new AuthFilter(logger),
      new ValidationFilter(),
    );

    const port = Number(process.env.PORT ?? process.env.APP_PORT ?? 5000);
    const host = '0.0.0.0';

    await app.listen(port, host);

    logger.log(
      `🚀 NestJS server started successfully at http://${host}:${port}`,
      'Bootstrap',
    );

    console.log('========================================');
    console.log(`🚀 Server Running: http://localhost:${port}`);
    console.log(`🌐 Listening Host : ${host}`);
    console.log('========================================');
  } catch (error) {
    console.error('❌ NestJS failed to start');
    console.error(error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Bootstrap Error');
  console.error(error);
});
