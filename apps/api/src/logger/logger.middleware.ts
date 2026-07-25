import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerServiceWrapper } from './logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerServiceWrapper) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;

      this.logger.logRequest(
        `${method} ${originalUrl} ${statusCode} - ${responseTime}ms`,
        {
          method,
          url: originalUrl,
          ip,
          userAgent,
          responseTime,
          statusCode,
        },
      );
    });

    next();
  }
}
