import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  BadRequestException,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch(BadRequestException)
export class ValidationFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as Record<
      string,
      unknown
    >;

    // Check if validation errors details exist
    const details = Array.isArray(exceptionResponse.errors)
      ? exceptionResponse.errors
      : [];
    const hasDetails = details.length > 0;

    const rawMessage = exceptionResponse.message || exception.message;
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

    return response.status(status).json({
      success: false,
      statusCode: status,
      error: hasDetails ? 'Validation Error' : 'Bad Request',
      message: hasDetails ? 'Validation failed' : messageString,
      ...(hasDetails ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
