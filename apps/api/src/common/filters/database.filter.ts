import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { QueryFailedError } from 'typeorm';
import { LoggerServiceWrapper } from '../../logger/logger.service';

@Catch(QueryFailedError)
export class DatabaseFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerServiceWrapper) {}

  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const driverError = exception.driverError as {
      code?: string;
      sqlMessage?: string;
      message?: string;
    };
    const code = driverError?.code || '';
    const sqlMessage = driverError?.sqlMessage || '';

    let message = 'Database error occurred';
    let statusCode = HttpStatus.BAD_REQUEST;
    let error = 'Database Error';

    // MySQL error code mapping
    if (code === 'ER_DUP_ENTRY' || sqlMessage.includes('Duplicate entry')) {
      statusCode = HttpStatus.CONFLICT;
      error = 'Conflict Error';

      const match = sqlMessage.match(/Duplicate entry '(.*)' for key/);
      const value = match ? match[1] : '';
      message = value
        ? `Record with value '${value}' already exists`
        : 'Record already exists';
      if (sqlMessage.toLowerCase().includes('email')) {
        message = 'Email already exists';
      }
    } else if (code === 'ER_NO_REFERENCED_ROW_2' || code === '1452') {
      message = 'Referenced record not found';
    } else if (code === 'ER_ROW_IS_REFERENCED_2' || code === '1451') {
      message =
        'Cannot delete or update because this record is referenced by other records';
    }

    this.logger.error(
      `Database exception on ${request.method} ${request.url}: ${exception.message}`,
      exception.stack,
      'DatabaseFilter',
      'database',
    );

    return response.status(statusCode).json({
      success: false,
      statusCode,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
