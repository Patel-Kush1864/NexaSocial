import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT || '587', 10),
  secure:
    process.env.MAIL_SECURE === 'true' ||
    parseInt(process.env.MAIL_PORT || '587', 10) === 465,
  user: process.env.MAIL_USER,
  password: process.env.MAIL_PASSWORD,
  fromName: process.env.MAIL_FROM_NAME || 'NexaSocial',
  from:
    process.env.MAIL_FROM_EMAIL ||
    process.env.MAIL_FROM ||
    'nexasocial101@gmail.com',
  appUrl: process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:5000',
}));
