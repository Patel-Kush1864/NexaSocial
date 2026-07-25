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
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(LoggerServiceWrapper);
  app.useLogger(logger);

  // Register Validation Pipe Globally
  app.useGlobalPipes(new ValidationPipe());

  // Register Exception Filters Globally
  // Specific filters are registered after the catch-all HttpExceptionFilter so they can match first.
  app.useGlobalFilters(
    new HttpExceptionFilter(logger),
    new DatabaseFilter(logger),
    new AuthFilter(logger),
    new ValidationFilter(),
  );

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
