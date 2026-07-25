import { ValidationPipeOptions } from '@nestjs/common';

export const validationPipeOptions: ValidationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true, // Automatically converts primitives (e.g. string to number)
  },
  stopAtFirstError: false,
  disableErrorMessages: process.env.APP_ENV === 'production',
};
