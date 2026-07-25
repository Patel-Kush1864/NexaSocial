import { HttpException, HttpStatus } from '@nestjs/common';

export class AuthenticationException extends HttpException {
  constructor(
    message = 'Authentication failed',
    status = HttpStatus.UNAUTHORIZED,
  ) {
    super(message, status);
  }
}
