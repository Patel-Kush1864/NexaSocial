import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';

const logDir = path.resolve(__dirname, '../../../logs');

const customFormat = winston.format.printf((info) => {
  const { timestamp, level, message, context, category, ...meta } = info;
  const ctx = typeof context === 'string' ? `[${context}] ` : '';
  const cat = typeof category === 'string' ? `<${category}> ` : '';
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  const msg = typeof message === 'string' ? message : JSON.stringify(message);

  return `${typeof timestamp === 'string' ? timestamp : ''} [NexaSocial] ${level.toUpperCase()}: ${ctx}${cat}${msg}${metaStr}`;
});

const requestFilter = winston.format((info) => {
  return info.category === 'request' ? info : false;
});

const securityFilter = winston.format((info) => {
  return info.category === 'security' ? info : false;
});

const appFilter = winston.format((info) => {
  // Prevent request and security logs from bloating general application logs
  return info.category !== 'request' && info.category !== 'security'
    ? info
    : false;
});

export const getWinstonConfig = (): winston.LoggerOptions => {
  const isDevelopment = process.env.APP_ENV !== 'production';

  const transports: winston.transport[] = [
    // Console Transport
    new winston.transports.Console({
      level: isDevelopment ? 'debug' : 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        isDevelopment ? winston.format.colorize() : winston.format.uncolorize(),
        isDevelopment ? customFormat : winston.format.json(),
      ),
    }),

    // Daily Rotate File for Application Logs (excludes requests and security)
    new DailyRotateFile({
      filename: path.join(logDir, 'application/application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: isDevelopment ? '7d' : '30d',
      level: 'info',
      format: winston.format.combine(
        appFilter(),
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),

    // Daily Rotate File for Request Logs
    new DailyRotateFile({
      filename: path.join(logDir, 'requests/request-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: isDevelopment ? '7d' : '30d',
      level: 'info',
      format: winston.format.combine(
        requestFilter(),
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),

    // Daily Rotate File for Security Logs
    new DailyRotateFile({
      filename: path.join(logDir, 'security/security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: isDevelopment ? '7d' : '30d',
      level: 'info',
      format: winston.format.combine(
        securityFilter(),
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),

    // Daily Rotate File for Error Logs
    new DailyRotateFile({
      filename: path.join(logDir, 'errors/error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: isDevelopment ? '7d' : '30d',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ];

  return {
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
    transports,
    exceptionHandlers: [
      new DailyRotateFile({
        filename: path.join(logDir, 'exceptions/exception-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: isDevelopment ? '7d' : '30d',
      }),
    ],
  };
};
