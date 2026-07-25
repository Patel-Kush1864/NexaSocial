import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME || 'NexaSocial',
  env: process.env.APP_ENV || 'development',
  port: parseInt(process.env.APP_PORT || '3001', 10),
  url: process.env.APP_URL || 'http://localhost:3001',
}));
