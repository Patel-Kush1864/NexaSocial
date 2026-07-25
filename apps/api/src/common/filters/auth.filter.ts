import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { LoggerServiceWrapper } from '../../logger/logger.service';

@Catch(UnauthorizedException)
export class AuthFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerServiceWrapper) {}

  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as Record<
      string,
      unknown
    >;
    const rawMessage = exceptionResponse.message || exception.message;

    let message = '';
    if (Array.isArray(rawMessage)) {
      message = rawMessage.join(', ');
    } else if (typeof rawMessage === 'string') {
      message = rawMessage;
    } else if (
      typeof rawMessage === 'number' ||
      typeof rawMessage === 'boolean'
    ) {
      message = String(rawMessage);
    } else if (rawMessage && typeof rawMessage === 'object') {
      message = JSON.stringify(rawMessage);
    }

    // JWT Error mappings
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('expired')) {
      message = 'Access token has expired';
    } else if (
      lowerMessage.includes('invalid') ||
      lowerMessage.includes('malformed')
    ) {
      message = 'Invalid access token';
    } else if (
      lowerMessage.includes('no auth') ||
      lowerMessage.includes('missing')
    ) {
      message = 'Authentication required';
    }

    this.logger.warn(
      `Auth failure on ${request.method} ${request.url}: ${message}`,
      'AuthFilter',
      'security',
    );

    return response.status(status).json({
      success: false,
      statusCode: status,
      error: 'Unauthorized Error',
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
