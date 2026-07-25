import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { LoggerServiceWrapper } from '../../logger/logger.service';

interface RequestWithUser extends Request {
  user?: {
    id?: string;
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerServiceWrapper) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithUser>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let details: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as Record<string, unknown>;

        const rawMessage = resObj.message || exception.message;
        let messageString = '';
        if (Array.isArray(rawMessage)) {
          messageString = rawMessage.join(', ');
        } else if (typeof rawMessage === 'string') {
          messageString = rawMessage;
        } else if (
          typeof rawMessage === 'number' ||
          typeof rawMessage === 'boolean'
        ) {
          messageString = String(rawMessage);
        } else if (rawMessage && typeof rawMessage === 'object') {
          messageString = JSON.stringify(rawMessage);
        }

        message = messageString;
        error =
          typeof resObj.error === 'string' ? resObj.error : exception.name;
        details = resObj.errors || null;
      } else {
        message =
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : String(exceptionResponse || '');
        error = exception.name;
      }
    }

    // Mask sensitive fields in request body for logs
    const sanitizedBody = request.body
      ? ({ ...request.body } as Record<string, unknown>)
      : {};
    const sensitiveKeys = ['password', 'token', 'secret', 'passwordConfirm'];
    for (const key of Object.keys(sanitizedBody)) {
      if (sensitiveKeys.includes(key)) {
        sanitizedBody[key] = '******';
      }
    }

    const userId = request.user?.id || 'unauthenticated';
    const trace = exception instanceof Error ? exception.stack : undefined;
    const errorMessage =
      exception instanceof Error ? exception.message : 'Unknown exception';

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} failed with status ${status}: ${errorMessage}`,
      trace,
      'HttpExceptionFilter',
      status >= HttpStatus.INTERNAL_SERVER_ERROR ? 'exception' : 'application',
    );

    // Extra details to log for audit
    this.logger.log(
      {
        path: request.url,
        method: request.method,
        userId,
        ip: request.ip,
        body: sanitizedBody,
        status,
      },
      'HttpExceptionFilterDetails',
      'exception',
    );

    // Return standardized response
    response.status(status).json({
      success: false,
      statusCode: status,
      error,
      message,
      ...(details ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
