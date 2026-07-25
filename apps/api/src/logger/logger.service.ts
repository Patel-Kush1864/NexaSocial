import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { getWinstonConfig } from './logger.config';
import { LogCategory } from './logger.interface';

@Injectable()
export class LoggerServiceWrapper implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger(getWinstonConfig());
  }

  log(
    message: unknown,
    context?: string,
    category: LogCategory = 'application',
  ) {
    const msg =
      typeof message === 'object' && message !== null
        ? JSON.stringify(message)
        : String(message);
    this.logger.info(msg, { context, category });
  }

  error(
    message: unknown,
    trace?: string,
    context?: string,
    category: LogCategory = 'exception',
  ) {
    const msg =
      typeof message === 'object' && message !== null
        ? JSON.stringify(message)
        : String(message);
    this.logger.error(msg, { context, trace, category });
  }

  warn(
    message: unknown,
    context?: string,
    category: LogCategory = 'application',
  ) {
    const msg =
      typeof message === 'object' && message !== null
        ? JSON.stringify(message)
        : String(message);
    this.logger.warn(msg, { context, category });
  }

  debug(
    message: unknown,
    context?: string,
    category: LogCategory = 'application',
  ) {
    const msg =
      typeof message === 'object' && message !== null
        ? JSON.stringify(message)
        : String(message);
    this.logger.debug(msg, { context, category });
  }

  verbose(
    message: unknown,
    context?: string,
    category: LogCategory = 'application',
  ) {
    const msg =
      typeof message === 'object' && message !== null
        ? JSON.stringify(message)
        : String(message);
    this.logger.verbose(msg, { context, category });
  }

  // Custom log wrappers for structured category-based logs
  logRequest(message: string, metadata: Record<string, unknown>) {
    this.logger.info(message, {
      category: 'request',
      ...metadata,
    });
  }

  logSecurity(
    message: string,
    level: 'info' | 'warn' | 'error',
    metadata: Record<string, unknown>,
  ) {
    this.logger.log(level, message, {
      category: 'security',
      ...metadata,
    });
  }
}
